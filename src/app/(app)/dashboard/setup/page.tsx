import type { Metadata } from "next";
import Link from "next/link";
import { AppPageHeader, Panel } from "@/components/app/AppShell";
import { AppIcon } from "@/components/app/AppIcons";
import { CheckAllButton } from "@/components/app/connections/CheckAllButton";
import { ConnectionCard, toCardData } from "@/components/app/connections/ConnectionCard";
import { ConnectNotice } from "@/components/app/connections/ConnectNotice";
import { DatabasePicker } from "@/components/app/connections/DatabasePicker";
import { TimezoneConfirm } from "@/components/app/connections/TimezoneConfirm";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { getCurrentAccount } from "@/lib/account";
import { PROVIDER_NAMES, STATUS_LABELS, type ConnectionStatus } from "@/lib/connection-messages";
import { configuredProviders, getConnections, getDataSource } from "@/lib/connections";
import { setupProgress, SETUP_STEPS, type SetupStepKey } from "@/lib/setup";

export const metadata: Metadata = { title: "Setup" };

type Step = SetupStepKey | "check";
const ORDER: Step[] = [...SETUP_STEPS, "check"];
const TITLES: Record<Step, string> = {
  notion: "Connect Notion",
  youtube: "Connect YouTube",
  google_drive: "Connect Google Drive",
  database: "Choose your content calendar",
  timezone: "Confirm your time zone",
  check: "Check your connections",
};
const INTROS: Record<Step, string> = {
  notion: "Notion is where you plan your videos. You choose which databases the app can see.",
  youtube: "Choose the Google account that owns the channel you publish to.",
  google_drive: "Your videos stay in your Google Drive. We read the file linked in your calendar when it is time to upload.",
  database: "Pick the Notion database you plan your videos in. You will map its fields next.",
  timezone: "Publish dates in Notion are read in this time zone.",
  check: "We test each connection now so problems show up before your first upload.",
};

/**
 * Onboarding (Design Spec §20). Every step can be skipped; automation stays off
 * until all of them are done (enforced when automation arrives in Phase 5).
 */
export default async function SetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentAccount();
  if (!me) throw new Error("Your account could not be loaded.");
  const sp = await searchParams;
  const [connections, dataSource] = await Promise.all([getConnections(me.account.id), getDataSource(me.account.id)]);
  const progress = setupProgress(connections, Boolean(dataSource), Boolean(me.account.timezone_confirmed_at));
  const available = configuredProviders();

  const requested = typeof sp.step === "string" && (ORDER as string[]).includes(sp.step) ? (sp.step as Step) : null;
  const step: Step = requested ?? progress.next ?? "check";
  const index = ORDER.indexOf(step);
  const nextStep = ORDER[index + 1] ?? null;
  const prevStep = ORDER[index - 1] ?? null;
  const returnTo = `/dashboard/setup`;

  return (
    <>
      <AppPageHeader title="Setup" description="Connect your tools once. After that, your Notion calendar drives your uploads." />
      <ConnectNotice searchParams={sp} />

      <div className="setup-layout">
        <Panel title="Your progress">
          <Progress label="Setup progress" value={progress.done} max={progress.total} />
          <ol className="setup-steps">
            {ORDER.map((s, i) => {
              const done = s === "check" ? progress.complete : progress.steps[s];
              return (
                <li key={s} aria-current={s === step ? "step" : undefined}>
                  {done ? <span className="check-done"><AppIcon name="check" size={16} /></span> : <span className="check-todo" aria-hidden="true" />}
                  <Link href={`/dashboard/setup?step=${s}`} className={done ? "muted" : undefined}>
                    {done ? <span className="visually-hidden">Done: </span> : null}
                    {i + 1}. {TITLES[s]}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="stack gap-6" style={{ minWidth: 0 }}>
          <div className="stack gap-2">
            <p className="eyebrow">Step {index + 1} of {ORDER.length}</p>
            <h2 className="h3">{TITLES[step]}</h2>
            <p className="muted">{INTROS[step]}</p>
          </div>

          {step === "notion" || step === "youtube" || step === "google_drive" ? (
            <ConnectionCard provider={step} data={toCardData(connections[step])} available={available[step]} returnTo={returnTo} timeZone={me.account.timezone} />
          ) : null}

          {step === "database" ? (
            <Panel>
              <DatabasePicker accountId={me.account.id} current={dataSource} notionConnected={connections.notion?.status === "connected"} />
            </Panel>
          ) : null}

          {step === "timezone" ? (
            <Panel>
              <TimezoneConfirm timezone={me.account.timezone} confirmed={Boolean(me.account.timezone_confirmed_at)} />
            </Panel>
          ) : null}

          {step === "check" ? (
            <Panel>
              <dl className="kv">
                {(["notion", "youtube", "google_drive"] as const).map((p) => (
                  <div key={p} style={{ display: "contents" }}>
                    <dt>{PROVIDER_NAMES[p]}</dt>
                    <dd>{STATUS_LABELS[(connections[p]?.status ?? "not_connected") as ConnectionStatus]}{connections[p]?.last_error_message && connections[p]?.status !== "connected" ? ` · ${connections[p]!.last_error_message}` : ""}</dd>
                  </div>
                ))}
                <dt>Content calendar</dt>
                <dd>{dataSource?.name ?? "Not chosen"}</dd>
                <dt>Time zone</dt>
                <dd>{me.account.timezone}{me.account.timezone_confirmed_at ? "" : " (not confirmed)"}</dd>
              </dl>
              <CheckAllButton />
              {progress.complete ? (
                <p className="notice" role="status">You are set up. Next, you will map your Notion fields to YouTube.</p>
              ) : (
                <p className="caption">Some steps are not finished. You can skip them for now, but automation cannot be turned on until they are done.</p>
              )}
            </Panel>
          ) : null}

          <div className="split" style={{ alignItems: "center" }}>
            {prevStep ? <Button href={`/dashboard/setup?step=${prevStep}`} variant="ghost">Back</Button> : <span />}
            {nextStep ? (
              <Button href={`/dashboard/setup?step=${nextStep}`} variant="secondary">
                {step !== "check" && (step === "timezone" ? progress.steps.timezone : progress.steps[step as SetupStepKey]) ? "Next step" : "Skip for now"}
              </Button>
            ) : (
              <Button href="/dashboard" variant="secondary">Go to Overview</Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
