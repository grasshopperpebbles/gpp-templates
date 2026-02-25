"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { features } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = React.useState(false);

  // If auth is disabled, redirect to home
  React.useEffect(() => {
    if (!features.auth) {
      router.push("/");
    }
  }, [router]);

  if (!features.auth) {
    return null;
  }

  const handleSuccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      {showRegister ? (
        <RegisterForm
          onSuccess={handleSuccess}
          onLoginClick={() => setShowRegister(false)}
        />
      ) : (
        <LoginForm
          onSuccess={handleSuccess}
          onRegisterClick={() => setShowRegister(true)}
        />
      )}
    </div>
  );
}
