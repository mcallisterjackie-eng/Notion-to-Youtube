-- Customer isolation and least privilege (Design Spec §25).
-- Two customers, A and B, each with a full set of rows. A must see only A's
-- rows, must not be able to touch B's, and must not reach tokens, technical error
-- detail, subscription/usage writes or the automation switch.
-- Runs in one transaction and rolls back: safe on a real project. (The Supabase
-- tool asks a person to confirm DELETE statements, so the remote run skips the
-- delete checks; they run locally and in CI.)

begin;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', what; end if;
end $$;

-- Expect a statement to be refused with a privilege / RLS error (SQLSTATE 42501).
create function pg_temp.refused(stmt text, what text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED (was allowed): %', what;
exception when insufficient_privilege then null;
end $$;

-- Run a statement and return how many rows it touched.
create function pg_temp.affected(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- --- Fixtures (as the database owner) -------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'customer-a@test.invalid', '{"full_name": "Customer A"}'),
  ('b0000000-0000-4000-8000-00000000000b', 'customer-b@test.invalid', '{"full_name": "Customer B"}');

create temp table ids as
select u.id as user_id, m.account_id,
       (select c.id from public.connections c where c.account_id = m.account_id and c.provider = 'notion') as notion_conn,
       case when u.id = 'a0000000-0000-4000-8000-00000000000a' then 'A' else 'B' end as who,
       gen_random_uuid() as ds, gen_random_uuid() as cfg, gen_random_uuid() as fm, gen_random_uuid() as job
  from auth.users u join public.account_members m on m.user_id = u.id
 where u.id in ('a0000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-00000000000b');

insert into public.data_sources (id, account_id, connection_id, external_id, name)
  select ds, account_id, notion_conn, 'notion-db-' || who, 'Calendar ' || who from ids;
insert into public.mapping_configs (id, account_id, data_source_id) select cfg, account_id, ds from ids;
insert into public.field_mappings (id, account_id, mapping_config_id, target_key, source_property_id, source_property_name, source_property_type)
  select fm, account_id, cfg, 'youtube.title', 'prop-title', 'Name', 'title' from ids;
insert into public.status_mappings (account_id, mapping_config_id, stage, source_property_id, option_name)
  select account_id, cfg, 'trigger', 'prop-status', 'Ready to Upload' from ids;
insert into public.usage_periods (account_id, period_start, period_end)
  select account_id, now(), now() + interval '1 month' from ids;
insert into public.upload_jobs (id, account_id, data_source_id, external_record_id, state)
  select job, account_id, ds, 'page-' || who, 'failed' from ids;
insert into public.job_errors (account_id, upload_job_id, category, code, customer_message, technical_message, service)
  select account_id, job, 'google_drive', 'DRIVE_NOT_FOUND', 'The video file could not be found.', 'secret internal detail', 'google_drive' from ids;
insert into public.connection_secrets (connection_id, account_id, vault_secret_id)
  select notion_conn, account_id, vault.create_secret('token-' || who) from ids;

grant select on ids to authenticated, anon;

-- --- As customer A -----------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

do $$
declare a ids; b ids;
begin
  select * into a from ids where who = 'A';
  select * into b from ids where who = 'B';

  -- Sees exactly their own rows, in every table.
  perform pg_temp.check((select count(*) from public.profiles) = 1, 'A sees one profile');
  perform pg_temp.check((select count(*) from public.accounts) = 1 and (select id from public.accounts) = a.account_id, 'A sees only own account');
  perform pg_temp.check((select count(*) from public.account_members) = 1, 'A sees only own membership');
  perform pg_temp.check((select count(*) from public.subscriptions) = 1, 'A sees one subscription');
  perform pg_temp.check((select count(*) from public.usage_periods) = 1, 'A sees own usage only');
  perform pg_temp.check((select count(*) from public.connections) = 3, 'A sees own three connections');
  perform pg_temp.check((select count(*) from public.data_sources) = 1, 'A sees own data source');
  perform pg_temp.check((select count(*) from public.mapping_configs) = 1, 'A sees own mapping config');
  perform pg_temp.check((select count(*) from public.field_mappings) = 1, 'A sees own field mapping');
  perform pg_temp.check((select count(*) from public.status_mappings) = 1, 'A sees own status mapping');
  perform pg_temp.check((select count(*) from public.upload_jobs) = 1, 'A sees own job');
  perform pg_temp.check((select count(*) from public.job_errors) = 1, 'A sees own error');
  perform pg_temp.check((select count(*) from public.accounts where id = b.account_id) = 0, 'B account invisible');
  perform pg_temp.check(not private.is_account_member(b.account_id), 'A is not a member of B');

  -- Cannot change or delete B's rows (silently zero rows).
  perform pg_temp.check(pg_temp.affected(format('update public.accounts set name = %L where id = %L', 'hacked', b.account_id)) = 0, 'cannot rename B account');
  perform pg_temp.check(pg_temp.affected(format('update public.profiles set full_name = %L where id = %L', 'hacked', b.user_id)) = 0, 'cannot edit B profile');
  perform pg_temp.check(pg_temp.affected(format('update public.field_mappings set source_property_name = %L where id = %L', 'hacked', b.fm)) = 0, 'cannot edit B mapping');
  perform pg_temp.check(pg_temp.affected(format('delete from public.field_mappings where id = %L', b.fm)) = 0, 'cannot delete B mapping');
  perform pg_temp.check(pg_temp.affected('delete from public.status_mappings where account_id <> ' || quote_literal(a.account_id)) = 0, 'cannot delete B status mappings');

  -- Cannot create rows in B's account, or point own rows at B's parents.
  perform pg_temp.refused(format(
    'insert into public.field_mappings (account_id, mapping_config_id, target_key) values (%L, %L, %L)', b.account_id, b.cfg, 'youtube.tags'),
    'insert mapping into B account');
  perform pg_temp.refused(format('update public.field_mappings set account_id = %L where id = %L', b.account_id, a.fm), 'move own mapping to B');
  begin
    execute format('insert into public.field_mappings (account_id, mapping_config_id, target_key) values (%L, %L, %L)', a.account_id, b.cfg, 'youtube.tags');
    raise exception 'FAILED (was allowed): own account_id with B mapping config';
  exception when foreign_key_violation then null;
  end;

  -- Can edit what the product lets them edit.
  perform pg_temp.check(pg_temp.affected(format('update public.accounts set name = %L, timezone = %L where id = %L', 'Renamed', 'Europe/London', a.account_id)) = 1, 'A edits own account');
  perform pg_temp.check(pg_temp.affected(format('update public.profiles set full_name = %L where id = %L', 'Customer A2', a.user_id)) = 1, 'A edits own profile');
  begin
    execute format('update public.accounts set timezone = %L where id = %L', 'Mars/Olympus', a.account_id);
    raise exception 'FAILED (was allowed): invalid time zone';
  exception when check_violation then null;
  end;

  -- Cannot write server-owned state, even their own.
  perform pg_temp.refused(format('update public.accounts set automation_status = %L where id = %L', 'enabled', a.account_id), 'A switches automation on directly');
  perform pg_temp.refused(format('update public.accounts set automation_activated_at = now() where id = %L', a.account_id), 'A moves activation time');
  perform pg_temp.refused(format('update public.subscriptions set status = %L where account_id = %L', 'active', a.account_id), 'A activates own subscription');
  perform pg_temp.refused(format('update public.usage_periods set videos_counted = 0 where account_id = %L', a.account_id), 'A resets own usage');
  perform pg_temp.refused(format('update public.connections set status = %L where account_id = %L', 'connected', a.account_id), 'A marks a connection healthy');
  perform pg_temp.refused(format('update public.mapping_configs set status = %L where id = %L', 'valid', a.cfg), 'A marks own mapping valid');
  perform pg_temp.refused(format('update public.upload_jobs set state = %L where id = %L', 'succeeded', a.job), 'A edits a job');
  perform pg_temp.refused('insert into public.accounts (name) values (''second'')', 'A creates an account');
  perform pg_temp.refused(format('insert into public.account_members (account_id, user_id) values (%L, %L)', b.account_id, a.user_id), 'A joins B account');
  perform pg_temp.refused(format('delete from public.accounts where id = %L', a.account_id), 'A deletes own account directly');

  -- Never sees tokens or technical error detail.
  perform pg_temp.refused('select * from public.connection_secrets', 'A reads connection secrets');
  perform pg_temp.refused('select technical_message from public.job_errors', 'A reads technical error message');
  perform pg_temp.refused('select external_response from public.job_errors', 'A reads raw service response');
  perform pg_temp.check((select customer_message from public.job_errors) = 'The video file could not be found.', 'A reads customer message');
end $$;

-- --- Signed out (anon) --------------------------------------------------------

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

do $$
declare t text;
begin
  foreach t in array array['profiles', 'accounts', 'account_members', 'subscriptions', 'usage_periods', 'connections',
                           'connection_secrets', 'data_sources', 'mapping_configs', 'field_mappings', 'status_mappings',
                           'upload_jobs', 'job_errors'] loop
    perform pg_temp.refused(format('select 1 from public.%I limit 1', t), 'anon reads ' || t);
  end loop;
end $$;

-- --- Owner-level checks ------------------------------------------------------

reset role;

do $$
declare a ids; v_secret uuid;
begin
  select * into a from ids where who = 'A';

  -- The API roles cannot reach Vault.
  perform pg_temp.check(not has_table_privilege('authenticated', 'vault.secrets', 'select'), 'authenticated has no Vault access');
  perform pg_temp.check(not has_table_privilege('anon', 'vault.secrets', 'select'), 'anon has no Vault access');
  perform pg_temp.check(to_regclass('vault.decrypted_secrets') is null or not has_table_privilege('authenticated', 'vault.decrypted_secrets', 'select'), 'authenticated cannot decrypt Vault');

  -- Editing a mapping resets its validation.
  update public.mapping_configs set status = 'valid', validated_at = now() where id = a.cfg;
  update public.field_mappings set source_property_name = 'Title' where id = a.fm;
  perform pg_temp.check((select status from public.mapping_configs where id = a.cfg) = 'incomplete', 'mapping edit resets validation');

  -- Removing a token row removes its encrypted secret.
  select vault_secret_id into v_secret from public.connection_secrets where connection_id = a.notion_conn;
  delete from public.connection_secrets where connection_id = a.notion_conn;
  perform pg_temp.check(not exists (select 1 from vault.secrets where id = v_secret), 'vault secret deleted with its row');

  -- Republish jobs link to the original; job history survives removing the data source.
  insert into public.upload_jobs (account_id, data_source_id, external_record_id, kind, republish_of_job_id)
    values (a.account_id, a.ds, 'page-A', 'republish', a.job);
  delete from public.data_sources where id = a.ds;
  perform pg_temp.check((select count(*) from public.upload_jobs where account_id = a.account_id) = 2, 'jobs kept after data source removed');
  perform pg_temp.check((select count(*) from public.upload_jobs where account_id = a.account_id and data_source_id is null) = 2, 'data source reference cleared');
  perform pg_temp.check((select count(*) from public.field_mappings where account_id = a.account_id) = 0, 'mappings removed with data source');
end $$;

select 'rls isolation: all checks passed' as result;
rollback;
