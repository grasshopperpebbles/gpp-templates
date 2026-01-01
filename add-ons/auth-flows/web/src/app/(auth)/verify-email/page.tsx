"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {status === "loading" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifying your email...
              </h1>
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center text-4xl">✓</div>
              <h1 className="text-2xl font-semibold tracking-tight text-green-600">
                Email Verified!
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Continue to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center text-4xl">✕</div>
              <h1 className="text-2xl font-semibold tracking-tight text-red-600">
                Verification Failed
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
