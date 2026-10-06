/**
 * Turns Supabase Auth errors into short, plain-English messages for the forms.
 * Unknown errors get a generic message; the technical detail goes to the log, not the screen.
 */

const byCode: Record<string, string> = {
  invalid_credentials: "That email and password do not match. Try again or reset your password.",
  email_not_confirmed: "Confirm your email first. Check your inbox for the link we sent.",
  user_already_exists: "An account with that email already exists. Log in instead.",
  email_exists: "An account with that email already exists. Log in instead.",
  weak_password: "Choose a stronger password: at least 8 characters.",
  same_password: "Choose a password you have not used before.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  over_email_send_rate_limit: "Too many emails sent. Wait a few minutes and try again.",
  signup_disabled: "New sign-ups are paused right now.",
  provider_disabled: "That sign-in method is not available yet.",
  validation_failed: "Check your details and try again.",
};

export const GENERIC_AUTH_ERROR = "Something went wrong. Try again in a moment.";
export const CONFIG_AUTH_ERROR = "Sign-in is not set up yet. Please try again later.";

export function friendlyAuthError(err: { code?: string; name?: string; message?: string } | null | undefined): string {
  if (!err) return GENERIC_AUTH_ERROR;
  if (err.name === "MissingEnvError") return CONFIG_AUTH_ERROR;
  if (err.code && byCode[err.code]) return byCode[err.code];
  return GENERIC_AUTH_ERROR;
}
