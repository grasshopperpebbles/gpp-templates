import { NextResponse } from "next/server";
import { callAuthApi, readJson, stringField } from "@/lib/auth-flows/api";

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await callAuthApi(
    "reset-password",
    { body: { token: stringField(body, "token"), password: stringField(body, "password") } },
    "Could not reset the password."
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status === 502 ? 502 : 400 });
  }
  return NextResponse.json({
    message: typeof result.data.message === "string" ? result.data.message : "Your password has been reset.",
  });
}
