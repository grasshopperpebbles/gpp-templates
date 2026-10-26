import { NextResponse } from "next/server";
import { callAuthApi, readJson, stringField } from "@/lib/auth-flows/api";

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await callAuthApi(
    "verify-email",
    { body: { token: stringField(body, "token") } },
    "This verification link is invalid or has expired."
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status === 502 ? 502 : 400 });
  }
  return NextResponse.json({
    message: typeof result.data.message === "string" ? result.data.message : "Your email address is verified.",
  });
}
