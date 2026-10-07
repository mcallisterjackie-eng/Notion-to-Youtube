-- Phase 3: server-only access to connection tokens, and time-zone confirmation.
--
-- Tokens live encrypted in Supabase Vault. These functions are the only way to
-- write or read them, and only the service role (trusted server code) may call
-- them. They address a connection by (account, provider), which server code
-- takes from the verified session, so a token can never be stored on or read
-- from another account's connection by passing the wrong ID.

-- Set when the person confirms their time zone during onboarding (Design Spec §13, §20).
alter table public.accounts add column timezone_confirmed_at timestamptz;
grant update (timezone_confirmed_at) on public.accounts to authenticated;

create function public.store_connection_secret(p_account_id uuid, p_provider public.connection_provider, p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_connection uuid;
  v_secret uuid;
begin
  if p_secret is null or p_secret = '' then raise exception 'empty secret'; end if;
  select id into v_connection from public.connections where account_id = p_account_id and provider = p_provider;
  if v_connection is null then raise exception 'connection not found'; end if;

  select vault_secret_id into v_secret from public.connection_secrets where connection_id = v_connection;
  if v_secret is null then
    v_secret := vault.create_secret(p_secret, null, 'oauth tokens for connection ' || v_connection::text);
    insert into public.connection_secrets (connection_id, account_id, vault_secret_id) values (v_connection, p_account_id, v_secret);
  else
    perform vault.update_secret(v_secret, p_secret);
    update public.connection_secrets set updated_at = now() where connection_id = v_connection;
  end if;
end $$;

create function public.read_connection_secret(p_account_id uuid, p_provider public.connection_provider)
returns text language sql stable security definer set search_path = '' as $$
  select d.decrypted_secret
    from public.connections c
    join public.connection_secrets s on s.connection_id = c.id and s.account_id = c.account_id
    join vault.decrypted_secrets d on d.id = s.vault_secret_id
   where c.account_id = p_account_id and c.provider = p_provider;
$$;

-- Removes the token row; the delete_vault_secret trigger removes the Vault secret.
create function public.delete_connection_secret(p_account_id uuid, p_provider public.connection_provider)
returns void language sql security definer set search_path = '' as $$
  delete from public.connection_secrets s
   using public.connections c
   where s.connection_id = c.id and c.account_id = p_account_id and c.provider = p_provider;
$$;

revoke all on function public.store_connection_secret(uuid, public.connection_provider, text) from public, anon, authenticated;
revoke all on function public.read_connection_secret(uuid, public.connection_provider) from public, anon, authenticated;
revoke all on function public.delete_connection_secret(uuid, public.connection_provider) from public, anon, authenticated;
grant execute on function public.store_connection_secret(uuid, public.connection_provider, text) to service_role;
grant execute on function public.read_connection_secret(uuid, public.connection_provider) to service_role;
grant execute on function public.delete_connection_secret(uuid, public.connection_provider) to service_role;
