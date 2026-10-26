"use client";

import { useState } from "react";

/** Asks the API to email a new verification link to `email`. */
export function ResendVerificationButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function resend() {
    setState("sending");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      setState(response.ok ? "sent" : "error");
      setMessage(response.ok ? "We sent a new link. Check your inbox." : result.error || "Could not send the link.");
    } catch {
      setState("error");
      setMessage("Could not reach the server. Please try again.");
    }
  }

  if (state === "sent") {
    return <span className="text-sm">{message}</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending"}
        className="text-sm font-medium underline underline-offset-4 disabled:opacity-50"
      >
        {state === "sending" ? "Sending..." : "Resend the link"}
      </button>
      {state === "error" && <span className="text-sm text-red-600">{message}</span>}
    </span>
  );
}
