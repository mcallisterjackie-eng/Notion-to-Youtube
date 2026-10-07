-- Account lifecycle: every sign-up, by email or Google, gets exactly one account
-- with its owner membership, subscription (none), three disconnected connections
-- and automation Inactive. Runs in one transaction and rolls back.

begin;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', what; end if;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  -- Email sign-up form: full_name + browser time zone.
  ('c0000000-0000-4000-8000-00000000000c', 'email-signup@test.invalid', '{"full_name": "  Casey   Email  ", "timezone": "America/Edmonton"}'),
  -- Google: name in "name"/"full_name", no time zone.
  ('d0000000-0000-4000-8000-00000000000d', 'google-signup@test.invalid', '{"name": "Dana Google"}'),
  -- Nothing usable: bad time zone, no name.
  ('e0000000-0000-4000-8000-00000000000e', 'bare@test.invalid', '{"timezone": "Not/AZone"}');

do $$
declare r record;
begin
  for r in select u.id, u.email from auth.users u
            where u.id in ('c0000000-0000-4000-8000-00000000000c', 'd0000000-0000-4000-8000-00000000000d', 'e0000000-0000-4000-8000-00000000000e') loop
    perform pg_temp.check((select count(*) from public.account_members where user_id = r.id) = 1, r.email || ': one membership');
    perform pg_temp.check((select role from public.account_members where user_id = r.id) = 'owner', r.email || ': owner');
    perform pg_temp.check((select count(*) from public.profiles where id = r.id) = 1, r.email || ': profile');
    perform pg_temp.check((select s.status from public.subscriptions s join public.account_members m using (account_id) where m.user_id = r.id) = 'none', r.email || ': subscription none');
    perform pg_temp.check((select a.automation_status from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = r.id) = 'inactive', r.email || ': automation inactive');
    perform pg_temp.check((select a.automation_activated_at from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = r.id) is null, r.email || ': never activated');
    perform pg_temp.check((select count(*) from public.connections c join public.account_members m using (account_id) where m.user_id = r.id and c.status = 'not_connected') = 3, r.email || ': three disconnected connections');
  end loop;

  perform pg_temp.check((select full_name from public.profiles where id = 'c0000000-0000-4000-8000-00000000000c') = 'Casey   Email', 'name trimmed');
  perform pg_temp.check((select a.timezone from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = 'c0000000-0000-4000-8000-00000000000c') = 'America/Edmonton', 'browser time zone kept');
  perform pg_temp.check((select full_name from public.profiles where id = 'd0000000-0000-4000-8000-00000000000d') = 'Dana Google', 'Google name used');
  perform pg_temp.check((select a.timezone from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = 'd0000000-0000-4000-8000-00000000000d') = 'UTC', 'no time zone -> UTC');
  perform pg_temp.check((select a.timezone from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = 'e0000000-0000-4000-8000-00000000000e') = 'UTC', 'invalid time zone -> UTC');
  perform pg_temp.check((select a.name from public.accounts a join public.account_members m on m.account_id = a.id where m.user_id = 'e0000000-0000-4000-8000-00000000000e') = 'bare', 'account named from email when no name');

  -- Time zone validation: IANA names only.
  perform pg_temp.check(private.is_valid_timezone('America/Edmonton'), 'IANA zone accepted');
  perform pg_temp.check(private.is_valid_timezone('America/Argentina/Buenos_Aires'), 'three-part IANA zone accepted');
  perform pg_temp.check(private.is_valid_timezone('UTC'), 'UTC accepted');
  perform pg_temp.check(not private.is_valid_timezone('EST'), 'abbreviation rejected');
  perform pg_temp.check(not private.is_valid_timezone('UTC+5'), 'POSIX offset rejected');
  perform pg_temp.check(not private.is_valid_timezone('Mars/Olympus'), 'unknown zone rejected');
  perform pg_temp.check(not private.is_valid_timezone(''), 'empty rejected');
  perform pg_temp.check(not private.is_valid_timezone(null), 'null rejected');

  -- Deleting the person removes their profile and membership.
  delete from auth.users where id = 'e0000000-0000-4000-8000-00000000000e';
  perform pg_temp.check(not exists (select 1 from public.profiles where id = 'e0000000-0000-4000-8000-00000000000e'), 'profile removed with user');
  perform pg_temp.check(not exists (select 1 from public.account_members where user_id = 'e0000000-0000-4000-8000-00000000000e'), 'membership removed with user');
end $$;

select 'account lifecycle: all checks passed' as result;
rollback;
