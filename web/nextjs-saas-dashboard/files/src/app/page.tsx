import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect authenticated users to dashboard, unauthenticated to login
  redirect("/dashboard");
}
