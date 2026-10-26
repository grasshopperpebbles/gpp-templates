"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";

// The API packs accept 8 to 72 characters (bcrypt's limit is 72 bytes).
function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (new TextEncoder().encode(password).length > 72) return "Password must be at most 72 bytes.";
  if (password !== confirm) return "Passwords don't match.";
  return null;
}

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not reset the password.");
        return;
      }
      setDoneMessage(result.message);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold">Invalid link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is incomplete. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }

  if (doneMessage) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-green-600">Password reset</h2>
        <p className="text-sm text-muted-foreground">{doneMessage}</p>
        <Link href="/login" className="mt-4 inline-block text-sm underline underline-offset-4">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
          disabled={isLoading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
          disabled={isLoading}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>
      <button type="submit" className={buttonClass} disabled={isLoading}>
        {isLoading ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
