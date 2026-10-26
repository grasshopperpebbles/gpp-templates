import { NextResponse } from "next/server";
import { callAuthApi } from "@/lib/auth-flows/api";

/** GET with the user's API access token in Authorization: Bearer <token>. */
export async function GET(request: Request) {
  const result = await callAuthApi(
    "verification-status",
    { method: "GET", authorization: request.headers.get("authorization") },
    "Could not load the verification status."
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    email: result.data.email,
    email_verified: result.data.email_verified === true,
    email_verified_at: result.data.email_verified_at ?? null,
  });
}
