-- The first version scanned pg_timezone_names on every call (~25 ms), and the
-- check runs on every account insert/update. This version is microseconds:
-- it accepts only IANA-style names (Area/Location, or UTC) that PostgreSQL can
-- actually convert to, which rejects abbreviations like "EST" and POSIX strings.
create or replace function private.is_valid_timezone(tz text) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if tz is null or tz !~ '^(UTC|[A-Z][A-Za-z_+-]*(/[A-Za-z0-9_+-]+){1,2})$' then
    return false;
  end if;
  perform pg_catalog.now() at time zone tz;
  return true;
exception when others then
  return false;
end $$;
