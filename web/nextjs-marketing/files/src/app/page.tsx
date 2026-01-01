import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome to {process.env.NEXT_PUBLIC_SITE_NAME ?? "GPP Web"}
        </h1>
        <p className="text-lg text-zinc-600">
          This is a production-ready Next.js scaffold intended for GPP projects.
          Customize this page to get started.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-medium mb-3">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-blue-600 hover:underline">
                Learn more about us →
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Get in touch →
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy →
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service →
              </Link>
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-xl font-medium mb-3">Next Steps</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Customize the homepage content</li>
            <li>Update about, privacy, and terms pages</li>
            <li>
              Optional: Connect to REST API (FastAPI/Express) at{" "}
              <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_API_BASE_URL</code>
            </li>
            <li>
              Optional: Connect to GraphQL (FastAPI/Strapi) at{" "}
              <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_GRAPHQL_ENDPOINT</code>
            </li>
            <li>
              Optional: Connect to WordPress GraphQL at{" "}
              <code className="rounded bg-zinc-100 px-1">NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT</code>
            </li>
            <li>
              Run: <code className="rounded bg-zinc-100 px-1">pnpm dev</code>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
