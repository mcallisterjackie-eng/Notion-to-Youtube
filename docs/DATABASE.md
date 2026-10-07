# Database

Supabase PostgreSQL. Schema lives in `supabase/migrations/` (applied in filename
order); security tests in `supabase/tests/`. Current state: **end of Phase 3**.

Project: `egogfmjojgcsbojbglsn` (used as the development database until a
separate production project is created in Phase 10).

## Principles

1. **Every customer row carries `account_id`.** Row Level Security (RLS) limits each signed-in person to accounts they belong to. Signed-out visitors (`anon`) can read nothing.
2. **Children point at parents by `(id, account_id)`**, so a row can never be attached to another account's parent, even by trusted code with a bug.
3. **Customers only write what the product lets them edit directly**: their name, the account name and time zone, and (from Phase 4) their field and status mappings. Everything else is written by trusted server code: subscriptions, usage, connections, tokens, jobs, errors, mapping validity, and the automation on/off switch.
4. **No customer's Notion structure is baked in.** Property names are data. Properties are referenced by Notion's permanent property ID, so renaming a column in Notion does not break a mapping. The list of SaaS fields a customer can map lives in application code, so adding a YouTube field needs no migration.
5. **Built to grow** (Design Spec §21, §24): membership table for future team accounts; `connections` and `data_sources` are generic, with MVP limits as plain constraints that can be dropped later.

## Tables

```text
auth.users ──1:1── profiles
     │
     └──< account_members >── accounts ──1:1── subscriptions
                                  │
                                  ├──< usage_periods
                                  ├──< connections ──1:1── connection_secrets ── vault.secrets
                                  │        │
                                  │        └──< data_sources ──1:1── mapping_configs ──< field_mappings
                                  │                 │                                └──< status_mappings
                                  ├──< upload_jobs ─┘ (reference cleared if the data source is removed)
                                  │        └── republish_of_job_id → upload_jobs
                                  └──< job_errors ── upload_job_id → upload_jobs
```

| Table | Purpose | Customer access |
| --- | --- | --- |
| `profiles` | Person's name | Read/update own `full_name` |
| `accounts` | Name, **time zone** (§13) and when it was confirmed in onboarding, **automation status** and **activation time** (§18, §19) | Read; update `name`, `timezone`, `timezone_confirmed_at` only |
| `account_members` | Who belongs to which account; role `owner` (MVP) | Read own memberships |
| `subscriptions` | Plan, status (`none`/`active`/`past_due`/`canceled`/`expired`), period, Stripe IDs | Read |
| `usage_periods` | Videos counted per billing period, limit 100 | Read |
| `connections` | Notion / YouTube / Google Drive: status, account name, scopes, health | Read |
| `connection_secrets` | Pointer to the OAuth tokens encrypted in **Supabase Vault** | **None** (not even own) |
| `data_sources` | The selected Notion database and a snapshot of its properties | Read |
| `mapping_configs` | One per data source; `incomplete` / `valid` / `invalid` + validation results | Read |
| `field_mappings` | SaaS field (`target_key`) → Notion property (ID, name, type, settings) | Read/insert/update/delete own |
| `status_mappings` | Workflow stage → Notion option. One stage = one option; one option may serve many stages (§7) | Read/insert/update/delete own |
| `upload_jobs` | One row per attempt (§15): record, kind (`automatic`/`republish`), state, YouTube result | Read |
| `job_errors` | Category (§16), code, customer message, **technical detail** | Read customer columns only; `technical_message`, `operation`, `external_response` are hidden |

### Rules enforced by the database

- **Sign-up creates the account.** A trigger on `auth.users` creates, for every new person (email or Google): profile, account (time zone from the browser at sign-up, else UTC), owner membership, subscription `none`, three `not_connected` connections, automation `inactive`.
- **Time zone** must be an IANA name (`America/Edmonton`) or `UTC`.
- **Editing any mapping** resets its config to `incomplete` until the server validates again.
- **Deleting a token row** also deletes its encrypted Vault secret.
- **Republish** jobs link to the job they republish; only republish jobs may.
- **Job history survives** switching Notion databases (the reference is cleared, the jobs stay).
- **MVP limits** (`connections_one_per_provider`, `data_sources_one_per_account`) are named constraints, easy to drop later.

### Token functions (Phase 3)

`store_connection_secret(account, provider, secret)`, `read_connection_secret(account, provider)`,
`delete_connection_secret(account, provider)`: the only way to touch tokens.
Executable by the **service role only** (not customers, not anon). They address a
connection by account + provider, which server code takes from the verified
session, so a token cannot be written to or read from another account's
connection. Re-storing (token refresh) updates the same Vault secret.

### Deliberately open

- **Job states** are checked text, not an enum, because "accepted by YouTube" vs "processing complete" (§12) is undecided.
- **What counts toward 100 videos:** successful uploads, including republishes (owner decision). Whether a *failed* republish counts is to be confirmed by Phase 5. The table works either way.
- **Activation protection and duplicate-event tables** come in Phase 5, when their shape is known.

## Server access pattern

- Server code gets the person and account from `getCurrentAccount()` (`src/lib/account.ts`), which uses the verified session and reads through RLS. **Never** take an account ID from the browser to decide whose data to touch (§25).
- Writes customers may make go through Server Actions with the user's session (RLS applies).
- The secret key is used only by `src/lib/supabase/admin.ts` (server-only), for writes customers may not make: connection status, data source selection and the token functions. Every admin query filters by the account from `getCurrentAccount()`.

## Testing

```bash
npm run test:db
```

Starts a throwaway local PostgreSQL, loads `supabase/tests/00_supabase_stub.sql`
(roles, `auth.users`, `auth.uid()` and Vault, as in Supabase), applies every
migration, then runs:

- `10_rls_isolation.sql`: customers A and B; A sees only A's rows in every table, cannot change, delete or insert into B's account, cannot attach rows to B's parents, cannot read tokens or technical error detail, cannot flip automation, subscription, usage, connection, job or mapping-validity state; `anon` reads nothing.
- `20_account_lifecycle.sql`: sign-up by email, Google and with no details; time zone validation; deleting a person.
- `30_connection_secrets.sql`: only the service role can store/read/delete tokens; tokens are separate per account; rotation reuses one Vault secret; customers may confirm their time zone.

The same files were run against the real project (inside a rolled-back
transaction). The Supabase tool asks a person to confirm any DELETE, so the
remote run covers everything except the deletion checks, which run locally and in CI.
The suite was also checked by deliberately breaking six rules (open read policy,
writable automation status, visible technical column, readable tokens, missing
composite foreign key, open insert policy); each was caught.

## Changing the schema

1. Add a new file `supabase/migrations/<timestamp>_<name>.sql`. Never edit an applied one.
2. `npm run test:db` and add tests for the change.
3. Apply it to Supabase and regenerate `src/lib/database.types.ts`.
4. Run Supabase's security and performance advisors.
