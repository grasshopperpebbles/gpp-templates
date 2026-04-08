import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth-config";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
