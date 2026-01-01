import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to backend API
    const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Always return success to prevent email enumeration attacks
    // The backend should handle this, but we add an extra layer here
    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success message to prevent enumeration
    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  }
}
