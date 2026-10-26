import { callAuthApi } from "@/lib/auth-flows/api";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

interface VerifyEmailBannerProps {
  /** The signed-in user's API access token (NextAuth: session.accessToken). */
  accessToken?: string | null;
  /** The signed-in user's email, for the resend button. */
  email?: string | null;
}

/**
 * Server component: a "verify your email" notice while the signed-in user's address is
 * unverified (asks the API's /auth/verification-status). Renders nothing once it is
 * verified, without a token, or when the API can't be reached.
 *
 * Registration on the pack's /auth/register signs the user in straight away and the API
 * emails the verification link, so put this at the top of signed-in pages, e.g. in
 * src/app/(dashboard)/layout.tsx:
 *   <VerifyEmailBanner accessToken={session.accessToken} email={session.user.email} />
 */
export async function VerifyEmailBanner({ accessToken, email }: VerifyEmailBannerProps) {
  if (!accessToken) return null;
  const status = await callAuthApi(
    "verification-status",
    { method: "GET", authorization: `Bearer ${accessToken}` },
    ""
  );
  if (!status.ok || status.data.email_verified === true) return null;
  const address = email || (typeof status.data.email === "string" ? status.data.email : "");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>
        Please verify your email address{address ? ` (${address})` : ""}: we sent you a link.
      </span>
      {address && <ResendVerificationButton email={address} />}
    </div>
  );
}
