-- LOCAL TESTING ONLY. Recreates the small parts of a Supabase database that the
-- migrations rely on (roles, auth.users, auth.uid(), Vault) so the migrations and
-- security tests can run on plain PostgreSQL in CI. Never applied to Supabase.

create extension if not exists pgcrypto;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
-- Supabase's default: new public tables are granted to the API roles. The migration must revoke.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}',
  raw_app_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Same definition as Supabase's auth.uid().
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create schema vault;
create table vault.secrets (id uuid primary key default gen_random_uuid(), name text, secret text not null);
create function vault.create_secret(new_secret text, new_name text default null) returns uuid
language sql as $$ insert into vault.secrets (secret, name) values (new_secret, new_name) returning id $$;
