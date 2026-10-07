-- Phase 2: core schema, account lifecycle and Row Level Security.
--
-- Principles (docs/DATABASE.md):
--   * Every customer row carries account_id; RLS limits each signed-in person to
--     accounts they are a member of. anon gets nothing.
--   * Children repeat account_id and reference their parent by (id, account_id),
--     so a row can never point at another account's parent.
--   * Customers write only what the product lets them edit directly. Everything
--     else (subscriptions, usage, connections, jobs, errors, mapping validity,
--     automation on/off) is written by trusted server code.
--   * Nothing is shaped around one customer's Notion database: property names
--     are data, the list of mappable SaaS fields lives in application code.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.automation_status as enum ('enabled', 'inactive');
create type public.subscription_status as enum ('none', 'active', 'past_due', 'canceled', 'expired');
create type public.member_role as enum ('owner'); -- future: 'admin', 'member' (Design Spec §21)
create type public.connection_provider as enum ('notion', 'youtube', 'google_drive');
create type public.connection_status as enum ('not_connected', 'connected', 'error', 'permission_problem');
create type public.data_source_type as enum ('notion'); -- future: 'google_sheets' (Design Spec §24)
create type public.job_kind as enum ('automatic', 'republish');
create type public.error_category as enum (
  'configuration', 'authentication', 'permission', 'notion', 'google_drive',
  'youtube', 'network', 'temporary', 'usage_subscription'
); -- Design Spec §16

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function private.is_valid_timezone(tz text) returns boolean
language sql stable set search_path = '' as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

-- ---------------------------------------------------------------------------
-- People and accounts
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  timezone text not null default 'UTC' check (private.is_valid_timezone(timezone)),
  automation_status public.automation_status not null default 'inactive',
  -- Design Spec §19: records already in the trigger state before this moment never upload automatically.
  automation_activated_at timestamptz,
  automation_deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_members (
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
create index account_members_user_id_idx on public.account_members (user_id);

-- Is the signed-in person a member of this account? Used by every policy.
-- SECURITY DEFINER so policies on account_members itself do not recurse.
create function private.is_account_member(p_account_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.account_members m
    where m.account_id = p_account_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_account_member(uuid) from public;
grant execute on function private.is_account_member(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Subscription and usage (written by Stripe webhooks / the job engine)
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  status public.subscription_status not null default 'none',
  plan text not null default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per billing period. Counts successful uploads, including republishes.
create table public.usage_periods (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  videos_counted integer not null default 0 check (videos_counted >= 0),
  video_limit integer not null default 100 check (video_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, period_start),
  check (period_end > period_start)
);

-- ---------------------------------------------------------------------------
-- Connections (filled by the OAuth flows in Phase 3)
-- ---------------------------------------------------------------------------

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  provider public.connection_provider not null,
  status public.connection_status not null default 'not_connected',
  external_account_id text,
  external_account_name text,
  granted_scopes text[] not null default '{}',
  connected_at timestamptz,
  last_checked_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, account_id),
  -- MVP: one connection per service per account (Design Spec §21). Drop to allow several channels.
  constraint connections_one_per_provider unique (account_id, provider)
);

-- OAuth tokens, encrypted in Supabase Vault. No customer access at all, even to their own:
-- RLS is on with no policies, and anon/authenticated have no privileges.
create table public.connection_secrets (
  connection_id uuid primary key,
  account_id uuid not null,
  vault_secret_id uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (connection_id, account_id) references public.connections (id, account_id) on delete cascade
);

-- Removing a token row also removes the encrypted secret from Vault.
create function private.delete_vault_secret() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where id = old.vault_secret_id;
  return old;
end $$;
revoke all on function private.delete_vault_secret() from public;

-- ---------------------------------------------------------------------------
-- Data sources and field mapping (Design Spec §5–7; engine built in Phase 4)
-- ---------------------------------------------------------------------------

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  connection_id uuid not null,
  source_type public.data_source_type not null default 'notion',
  external_id text not null,        -- e.g. the Notion database ID
  name text,
  url text,
  properties_snapshot jsonb,        -- last discovered properties: id, name, type, options
  properties_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, account_id),
  foreign key (connection_id, account_id) references public.connections (id, account_id) on delete cascade,
  -- MVP: one selected database per account.
  constraint data_sources_one_per_account unique (account_id)
);

create table public.mapping_configs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  data_source_id uuid not null,
  -- Set only by server-side validation (Phase 4). Any mapping edit resets it to 'incomplete'.
  status text not null default 'incomplete' check (status in ('incomplete', 'valid', 'invalid')),
  validation_results jsonb not null default '[]',
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, account_id),
  unique (data_source_id),
  foreign key (data_source_id, account_id) references public.data_sources (id, account_id) on delete cascade
);

-- One row per SaaS field the customer maps. target_key comes from the catalogue in
-- application code (e.g. 'youtube.title', 'video.source', 'output.youtube_url').
-- Properties are referenced by Notion's permanent property ID, so renaming a column
-- in Notion does not break the mapping; the name is a display cache.
create table public.field_mappings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  mapping_config_id uuid not null,
  target_key text not null check (target_key ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$' and char_length(target_key) <= 100),
  source_property_id text,
  source_property_name text,
  source_property_type text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mapping_config_id, target_key),
  foreign key (mapping_config_id, account_id) references public.mapping_configs (id, account_id) on delete cascade
);

-- Workflow stage -> Notion status/select option. One stage maps to one option, but the
-- same option may serve several stages (Design Spec §7: "Published" = Uploaded and Scheduled).
create table public.status_mappings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  mapping_config_id uuid not null,
  stage text not null check (stage ~ '^[a-z][a-z0-9_]*$' and char_length(stage) <= 50),
  source_property_id text not null,
  option_id text,
  option_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mapping_config_id, stage),
  foreign key (mapping_config_id, account_id) references public.mapping_configs (id, account_id) on delete cascade
);

-- Editing a mapping invalidates the last validation.
create function private.invalidate_mapping_config() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.mapping_configs
     set status = 'incomplete', validated_at = null
   where id = coalesce(new.mapping_config_id, old.mapping_config_id)
     and status <> 'incomplete';
  return null;
end $$;
revoke all on function private.invalidate_mapping_config() from public;

-- ---------------------------------------------------------------------------
-- Upload jobs and errors (Design Spec §14–16)
-- ---------------------------------------------------------------------------

create table public.upload_jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  data_source_id uuid,
  external_record_id text not null,   -- the Notion page ID
  external_record_url text,
  record_title text,
  kind public.job_kind not null default 'automatic',
  republish_of_job_id uuid,
  -- Kept as checked text: "accepted by YouTube" vs "processing complete" is still open (§12).
  state text not null default 'queued'
    check (state in ('queued', 'validating', 'retrieving', 'uploading', 'processing', 'succeeded', 'failed', 'canceled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  source_video_url text,              -- the Drive URL used by this attempt (republish re-reads Notion, §14)
  youtube_video_id text,
  youtube_video_url text,
  youtube_studio_url text,
  scheduled_publish_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, account_id),
  -- History survives switching databases: only the reference is cleared.
  foreign key (data_source_id, account_id) references public.data_sources (id, account_id) on delete set null (data_source_id),
  foreign key (republish_of_job_id, account_id) references public.upload_jobs (id, account_id) on delete set null (republish_of_job_id),
  check (kind = 'republish' or republish_of_job_id is null)
);
create index upload_jobs_account_created_idx on public.upload_jobs (account_id, created_at desc);
create index upload_jobs_account_record_idx on public.upload_jobs (account_id, external_record_id);

create table public.job_errors (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  upload_job_id uuid,
  external_record_id text,
  category public.error_category not null,
  code text not null,
  customer_message text not null,     -- shown in the dashboard and written to Notion
  service text check (service in ('notion', 'google_drive', 'youtube', 'google_oauth', 'stripe', 'internal')),
  -- Technical detail: stored for support, never readable by customers (column privileges below).
  technical_message text,
  operation text,
  external_response jsonb,
  created_at timestamptz not null default now(),
  foreign key (upload_job_id, account_id) references public.upload_jobs (id, account_id) on delete cascade
);
create index job_errors_account_created_idx on public.job_errors (account_id, created_at desc);
create index job_errors_job_idx on public.job_errors (upload_job_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.accounts for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.subscriptions for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.usage_periods for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.connections for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.connection_secrets for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.data_sources for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.mapping_configs for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.field_mappings for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.status_mappings for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.upload_jobs for each row execute function private.set_updated_at();

create trigger delete_vault_secret after delete on public.connection_secrets
  for each row execute function private.delete_vault_secret();

create trigger invalidate_mapping_config after insert or update or delete on public.field_mappings
  for each row execute function private.invalidate_mapping_config();
create trigger invalidate_mapping_config after insert or update or delete on public.status_mappings
  for each row execute function private.invalidate_mapping_config();

-- ---------------------------------------------------------------------------
-- Account lifecycle: every new sign-up (email or Google) gets its own account.
-- ---------------------------------------------------------------------------

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_account_id uuid;
  v_name text := left(trim(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    ''
  )), 200);
  v_tz text := new.raw_user_meta_data ->> 'timezone';
begin
  if v_tz is null or not private.is_valid_timezone(v_tz) then
    v_tz := 'UTC';
  end if;

  insert into public.profiles (id, full_name) values (new.id, v_name);

  insert into public.accounts (name, timezone)
  values (coalesce(nullif(v_name, ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'My account'), v_tz)
  returning id into v_account_id;

  insert into public.account_members (account_id, user_id, role) values (v_account_id, new.id, 'owner');
  insert into public.subscriptions (account_id) values (v_account_id);
  insert into public.connections (account_id, provider)
  values (v_account_id, 'notion'), (v_account_id, 'youtube'), (v_account_id, 'google_drive');

  return new;
end $$;
revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, grant only what customers may do.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.is_account_member(uuid) to authenticated, service_role;
grant execute on function private.is_valid_timezone(text) to authenticated, service_role;

grant select, update (full_name) on public.profiles to authenticated;
grant select, update (name, timezone) on public.accounts to authenticated;
grant select on public.account_members to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.usage_periods to authenticated;
grant select on public.connections to authenticated;
grant select on public.data_sources to authenticated;
grant select on public.mapping_configs to authenticated;
grant select, insert, update, delete on public.field_mappings to authenticated;
grant select, insert, update, delete on public.status_mappings to authenticated;
grant select on public.upload_jobs to authenticated;
grant select (id, account_id, upload_job_id, external_record_id, category, code, customer_message, service, created_at)
  on public.job_errors to authenticated;
-- connection_secrets: no grants to anon or authenticated.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_periods enable row level security;
alter table public.connections enable row level security;
alter table public.connection_secrets enable row level security;
alter table public.data_sources enable row level security;
alter table public.mapping_configs enable row level security;
alter table public.field_mappings enable row level security;
alter table public.status_mappings enable row level security;
alter table public.upload_jobs enable row level security;
alter table public.job_errors enable row level security;

create policy "own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members: read account" on public.accounts
  for select to authenticated using (private.is_account_member(id));
create policy "members: update account" on public.accounts
  for update to authenticated using (private.is_account_member(id)) with check (private.is_account_member(id));

create policy "own memberships: read" on public.account_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "members: read" on public.subscriptions for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.usage_periods for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.connections for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.data_sources for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.mapping_configs for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.upload_jobs for select to authenticated using (private.is_account_member(account_id));
create policy "members: read" on public.job_errors for select to authenticated using (private.is_account_member(account_id));

create policy "members: read" on public.field_mappings for select to authenticated using (private.is_account_member(account_id));
create policy "members: insert" on public.field_mappings for insert to authenticated with check (private.is_account_member(account_id));
create policy "members: update" on public.field_mappings for update to authenticated
  using (private.is_account_member(account_id)) with check (private.is_account_member(account_id));
create policy "members: delete" on public.field_mappings for delete to authenticated using (private.is_account_member(account_id));

create policy "members: read" on public.status_mappings for select to authenticated using (private.is_account_member(account_id));
create policy "members: insert" on public.status_mappings for insert to authenticated with check (private.is_account_member(account_id));
create policy "members: update" on public.status_mappings for update to authenticated
  using (private.is_account_member(account_id)) with check (private.is_account_member(account_id));
create policy "members: delete" on public.status_mappings for delete to authenticated using (private.is_account_member(account_id));
