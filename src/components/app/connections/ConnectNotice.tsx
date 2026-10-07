import { connectionErrorMessage, PROVIDER_NAMES, type ProviderKey } from "@/lib/connection-messages";

const isProviderKey = (v: unknown): v is ProviderKey => v === "notion" || v === "youtube" || v === "google_drive";

/** Message shown after coming back from Notion or Google (?connected= / ?connectError=). */
export function ConnectNotice({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const connected = searchParams.connected;
  if (isProviderKey(connected)) {
    return <p className="notice" role="status">{PROVIDER_NAMES[connected]} is connected.</p>;
  }
  const error = typeof searchParams.connectError === "string" ? searchParams.connectError : null;
  const provider = isProviderKey(searchParams.provider) ? searchParams.provider : null;
  if (error && provider) {
    return <p className="notice notice-problem" role="alert">{connectionErrorMessage(error, provider)}</p>;
  }
  return null;
}
