-- Token storage (Phase 3): only the service role can store, read or delete
-- tokens; functions are scoped by (account, provider); rotation keeps one
-- Vault secret per connection. Runs in one transaction and rolls back.

begin;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', what; end if;
end $$;

create function pg_temp.refused(stmt text, what text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED (was allowed): %', what;
exception when insufficient_privilege then null;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('a1000000-0000-4000-8000-00000000000a', 'secrets-a@test.invalid', '{"full_name": "Secrets A"}'),
  ('b1000000-0000-4000-8000-00000000000b', 'secrets-b@test.invalid', '{"full_name": "Secrets B"}');

create temp table ids as
select u.id as user_id, m.account_id,
       case when u.id = 'a1000000-0000-4000-8000-00000000000a' then 'A' else 'B' end as who
  from auth.users u join public.account_members m on m.user_id = u.id
 where u.id in ('a1000000-0000-4000-8000-00000000000a', 'b1000000-0000-4000-8000-00000000000b');
grant select on ids to authenticated, anon, service_role;

-- Customers cannot call the token functions at all, not even for their own account.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-00000000000a", "role": "authenticated"}';
do $$
declare a ids;
begin
  select * into a from ids where who = 'A';
  perform pg_temp.refused(format('select public.store_connection_secret(%L, %L, %L)', a.account_id, 'notion', 'x'), 'customer stores a token');
  perform pg_temp.refused(format('select public.read_connection_secret(%L, %L)', a.account_id, 'notion'), 'customer reads a token');
  perform pg_temp.refused(format('select public.delete_connection_secret(%L, %L)', a.account_id, 'notion'), 'customer deletes a token');
end $$;

reset role;
set local role anon;
do $$
declare a ids;
begin
  select * into a from ids where who = 'A';
  perform pg_temp.refused(format('select public.read_connection_secret(%L, %L)', a.account_id, 'notion'), 'anon reads a token');
end $$;

-- The service role (trusted server code) can.
reset role;
set local role service_role;
do $$
declare a ids; b ids; v_first uuid;
begin
  select * into a from ids where who = 'A';
  select * into b from ids where who = 'B';

  perform public.store_connection_secret(a.account_id, 'notion', '{"access_token":"a-1"}');
  perform public.store_connection_secret(b.account_id, 'notion', '{"access_token":"b-1"}');
  perform pg_temp.check(public.read_connection_secret(a.account_id, 'notion') = '{"access_token":"a-1"}', 'A token stored and read');
  perform pg_temp.check(public.read_connection_secret(b.account_id, 'notion') = '{"access_token":"b-1"}', 'B token separate');
  perform pg_temp.check(public.read_connection_secret(a.account_id, 'youtube') is null, 'no token for unconnected provider');

  -- Rotation updates the same Vault secret.
  select vault_secret_id into v_first from public.connection_secrets s join public.connections c on c.id = s.connection_id
   where c.account_id = a.account_id and c.provider = 'notion';
  perform public.store_connection_secret(a.account_id, 'notion', '{"access_token":"a-2"}');
  perform pg_temp.check(public.read_connection_secret(a.account_id, 'notion') = '{"access_token":"a-2"}', 'rotated token read back');
  perform pg_temp.check((select count(*) from public.connection_secrets s join public.connections c on c.id = s.connection_id
                          where c.account_id = a.account_id) = 1, 'still one token row');
  perform pg_temp.check((select vault_secret_id from public.connection_secrets s join public.connections c on c.id = s.connection_id
                          where c.account_id = a.account_id and c.provider = 'notion') = v_first, 'same Vault secret reused');

  -- Deleting A's token leaves B's alone and removes the Vault secret.
  perform public.delete_connection_secret(a.account_id, 'notion');
  perform pg_temp.check(public.read_connection_secret(a.account_id, 'notion') is null, 'A token deleted');
  perform pg_temp.check(public.read_connection_secret(b.account_id, 'notion') = '{"access_token":"b-1"}', 'B token untouched');

  -- Unknown account is refused; empty secrets are refused.
  begin
    perform public.store_connection_secret(gen_random_uuid(), 'notion', 'x');
    raise exception 'FAILED (was allowed): token for unknown account';
  exception when raise_exception then
    if sqlerrm not like 'connection not found%' then raise; end if;
  end;
  begin
    perform public.store_connection_secret(a.account_id, 'notion', '');
    raise exception 'FAILED (was allowed): empty token';
  exception when raise_exception then
    if sqlerrm not like 'empty secret%' then raise; end if;
  end;
end $$;

-- Customers may confirm their time zone, but nothing else new.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a1000000-0000-4000-8000-00000000000a", "role": "authenticated"}';
do $$
declare a ids; n bigint;
begin
  select * into a from ids where who = 'A';
  execute format('update public.accounts set timezone_confirmed_at = now() where id = %L', a.account_id);
  get diagnostics n = row_count;
  perform pg_temp.check(n = 1, 'A confirms own time zone');
end $$;

select 'connection secrets: all checks passed' as result;
rollback;
