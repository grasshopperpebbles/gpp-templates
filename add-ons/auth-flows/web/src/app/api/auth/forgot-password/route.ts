import { NextResponse } from "next/server";
import { callAuthApi, readJson, stringField } from "@/lib/auth-flows/api";

const SENT = "If an account exists for that email, we sent a password reset link.";

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await callAuthApi(
    "forgot-password",
    { body: { email: stringField(body, "email") } },
    "Could not send the reset link."
  );
  // Only input errors are shown; everything else gets the same answer, so the
  // response never tells whether the email has an account.
  if (result.status === 400 || result.status === 422) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: SENT });
}
