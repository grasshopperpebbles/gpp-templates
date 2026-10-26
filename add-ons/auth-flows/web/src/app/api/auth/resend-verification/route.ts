import { NextResponse } from "next/server";
import { callAuthApi, readJson, stringField } from "@/lib/auth-flows/api";

const SENT = "If that account exists and is not verified yet, we sent a new verification link.";

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await callAuthApi(
    "resend-verification",
    { body: { email: stringField(body, "email") } },
    "Could not send the verification link."
  );
  if (result.status === 400 || result.status === 422) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: SENT });
}
