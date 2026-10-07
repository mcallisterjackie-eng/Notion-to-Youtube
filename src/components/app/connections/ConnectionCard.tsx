import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/app/AppShell";
import { AppIcon, type IconName } from "@/components/app/AppIcons";
import { PROVIDER_NAMES, PROVIDER_PURPOSE, STATUS_LABELS, type ConnectionStatus, type ProviderKey } from "@/lib/connection-messages";
import { ConnectionActions } from "./ConnectionActions";

const ICONS: Record<ProviderKey, IconName> = { notion: "database", youtube: "play", google_drive: "folder" };
const ACCOUNT_LABEL: Record<ProviderKey, string> = { notion: "Workspace", youtube: "Channel", google_drive: "Google account" };
const TONES: Record<ConnectionStatus, "neutral" | "action" | "highlight" | "attention"> = {
  not_connected: "neutral",
  connected: "action",
  error: "highlight",
  permission_problem: "attention",
};

export type ConnectionCardData = {
  status: ConnectionStatus;
  accountName: string | null;
  connectedAt: string | null;
  lastCheckedAt: string | null;
  message: string | null;
};

/** A full-page link styled as the primary button: connecting leaves the app for Notion/Google. */
function ConnectLink({ href, emphasis, children }: { href: string; emphasis: "primary" | "secondary"; children: React.ReactNode }) {
  return <a href={href} className={`sdl-btn sdl-btn-${emphasis}`}>{children}</a>;
}

type ConnectionRow = {
  status: string;
  external_account_name: string | null;
  connected_at: string | null;
  last_checked_at: string | null;
  last_error_message: string | null;
};

export function toCardData(c: ConnectionRow | null): ConnectionCardData {
  return {
    status: (c?.status ?? "not_connected") as ConnectionStatus,
    accountName: c?.external_account_name ?? null,
    connectedAt: c?.connected_at ?? null,
    lastCheckedAt: c?.last_checked_at ?? null,
    message: c?.last_error_message ?? null,
  };
}

function formatDate(iso: string | null, timeZone: string) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone }).format(new Date(iso));
}

/** One service on the Connections page and in Setup: status, account, health, and the right next action. */
export function ConnectionCard({
  provider,
  data,
  available,
  returnTo,
  timeZone,
  extra,
  disconnectWarning,
  emphasis = "secondary",
}: {
  provider: ProviderKey;
  data: ConnectionCardData;
  /** False when this environment has no credentials for the service yet. */
  available: boolean;
  returnTo: string;
  timeZone: string;
  extra?: React.ReactNode;
  disconnectWarning?: string;
  /** Brand rule: one primary button per view. Setup shows one card, so it passes "primary". */
  emphasis?: "primary" | "secondary";
}) {
  const name = PROVIDER_NAMES[provider];
  const connectHref = `/api/connect/${provider}/start?returnTo=${encodeURIComponent(returnTo)}`;
  const hasLink = data.status !== "not_connected";
  const connected = formatDate(data.connectedAt, timeZone);
  const checked = formatDate(data.lastCheckedAt, timeZone);

  return (
    <Panel id={`connection-${provider}`}>
      <div className="connection-card" data-provider={provider} data-status={data.status}>
        <div className="connection-head">
          <span className="connection-icon" style={{ background: "var(--surface)" }}><AppIcon name={ICONS[provider]} size={24} /></span>
          <div className="stack" style={{ flex: 1, minWidth: 0 }}>
            <h2 className="h4">{name}</h2>
            <p className="caption">{PROVIDER_PURPOSE[provider]}</p>
          </div>
          <Badge tone={TONES[data.status]}>{STATUS_LABELS[data.status]}</Badge>
        </div>

        {hasLink && (data.accountName || connected) ? (
          <dl className="kv">
            {data.accountName ? (<><dt>{ACCOUNT_LABEL[provider]}</dt><dd className="truncate">{data.accountName}</dd></>) : null}
            {connected ? (<><dt>Connected</dt><dd>{connected}</dd></>) : null}
            {checked ? (<><dt>Last checked</dt><dd>{checked}</dd></>) : null}
          </dl>
        ) : null}

        {data.message && data.status !== "connected" ? (
          <p className="notice notice-problem" role="status"><AppIcon name="alert" size={16} /> {data.message}</p>
        ) : null}

        {!available ? (
          <p className="caption">Connecting {name} is not available yet.</p>
        ) : data.status === "not_connected" ? (
          <div className="row"><ConnectLink href={connectHref} emphasis={emphasis}>Connect {name}</ConnectLink></div>
        ) : (
          <>
            {data.status !== "connected" ? <div className="row"><ConnectLink href={connectHref} emphasis={emphasis}>Reconnect {name}</ConnectLink></div> : extra}
            <ConnectionActions provider={provider} name={name} disconnectWarning={disconnectWarning} />
          </>
        )}
      </div>
    </Panel>
  );
}
