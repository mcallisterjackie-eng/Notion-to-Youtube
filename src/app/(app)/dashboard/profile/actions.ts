"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccount } from "@/lib/account";
import { log } from "@/lib/log";
import { checkName, checkTimezone } from "@/lib/profile-validation";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SAVE_FAILED = "That did not save. Try again in a moment.";

/** Update the signed-in person's name. The row is chosen by the session, never by the form. */
export async function updateName(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return { ok: false, error: "Your session has ended. Log in again." };
  const name = checkName(formData.get("name"));
  if (!name.ok) return name;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: name.value }).eq("id", me.userId);
  if (error) {
    log.error("profile.updateName", error.message, { code: error.code });
    return { ok: false, error: SAVE_FAILED };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Update the account time zone (Design Spec §13: used to read scheduled publish dates). */
export async function updateTimezone(formData: FormData): Promise<ActionResult> {
  const me = await getCurrentAccount();
  if (!me) return { ok: false, error: "Your session has ended. Log in again." };
  const tz = checkTimezone(formData.get("timezone"));
  if (!tz.ok) return tz;

  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update({ timezone: tz.value }).eq("id", me.account.id);
  // 23514: the database's own time-zone check refused it (its zone list can differ slightly from the browser's).
  if (error?.code === "23514") return { ok: false, error: "Choose a time zone from the list." };
  if (error) {
    log.error("profile.updateTimezone", error.message, { code: error.code });
    return { ok: false, error: SAVE_FAILED };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
