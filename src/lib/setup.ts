/**
 * Onboarding progress (Design Spec §20). Pure: steps can be skipped, but setup
 * is complete only when every one is done.
 */

type Conn = { status: string } | null;

export type SetupStepKey = "notion" | "youtube" | "google_drive" | "database" | "timezone";
export const SETUP_STEPS: SetupStepKey[] = ["notion", "youtube", "google_drive", "database", "timezone"];
export type SetupProgress = { steps: Record<SetupStepKey, boolean>; done: number; total: number; complete: boolean; next: SetupStepKey | null };

export function setupProgress(
  connections: { notion: Conn; youtube: Conn; google_drive: Conn },
  hasDataSource: boolean,
  timezoneConfirmed: boolean,
): SetupProgress {
  const ok = (c: Conn) => c?.status === "connected";
  const steps: Record<SetupStepKey, boolean> = {
    notion: ok(connections.notion),
    youtube: ok(connections.youtube),
    google_drive: ok(connections.google_drive),
    database: hasDataSource,
    timezone: timezoneConfirmed,
  };
  const done = SETUP_STEPS.filter((k) => steps[k]).length;
  return { steps, done, total: SETUP_STEPS.length, complete: done === SETUP_STEPS.length, next: SETUP_STEPS.find((k) => !steps[k]) ?? null };
}
