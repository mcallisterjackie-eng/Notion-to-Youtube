"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccount } from "@/lib/account";
import { checkAllConnections, checkConnection, disconnect, selectDatabase } from "@/lib/connections";
import { isProvider } from "@/lib/integrations/config";
import { log } from "@/lib/log";
import { checkTimezone } from "@/lib/profile-validation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_ENDED: ActionResult = { ok: false, error: "Your session has ended. Log in again." };
const FAILED = "That did not work. Try again in a moment.";

function refresh() {
  revalidatePath("/dashboard", "layout");
}

export async function disconnectAction(provider: string): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return SESSION_ENDED;
  if (!isProvider(provider)) return { ok: false, error: FAILED };
  try {
    await disconnect(me.account.id, provider);
  } catch (err) {
    log.error("connections.disconnect", err instanceof Error ? err.message : "unknown error", { provider });
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

export async function checkConnectionAction(provider?: string): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return SESSION_ENDED;
  try {
    if (provider) {
      if (!isProvider(provider)) return { ok: false, error: FAILED };
      await checkConnection(me.account.id, provider);
    } else {
      await checkAllConnections(me.account.id);
    }
  } catch (err) {
    log.error("connections.check", err instanceof Error ? err.message : "unknown error", { provider });
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

export async function selectDatabaseAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return SESSION_ENDED;
  const id = formData.get("dataSourceId");
  if (typeof id !== "string" || !id) return { ok: false, error: "Choose a database from the list." };
  try {
    const result = await selectDatabase(me.account.id, id);
    if (!result.ok) return result;
  } catch (err) {
    log.error("connections.selectDatabase", err instanceof Error ? err.message : "unknown error");
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

/** Onboarding: save and confirm the account time zone (Design Spec §13). */
export async function confirmTimezoneAction(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return SESSION_ENDED;
  const tz = checkTimezone(formData.get("timezone"));
  if (!tz.ok) return tz;
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ timezone: tz.value, timezone_confirmed_at: new Date().toISOString() })
    .eq("id", me.account.id);
  if (error?.code === "23514") return { ok: false, error: "Choose a time zone from the list." };
  if (error) {
    log.error("setup.confirmTimezone", error.message, { code: error.code });
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}
