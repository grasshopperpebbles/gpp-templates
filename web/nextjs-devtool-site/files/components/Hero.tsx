import Link from "next/link";
import { CodeBlock } from "./CodeBlock";

const heroCode = `# Create a new project
gpp init my-saas

# Add platforms
gpp add web saas-dashboard
gpp add api express
gpp add cms strapi-only
gpp add mobile expo

# Start development
gpp start web`;

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              One CLI for{" "}
              <span className="text-brand-600 dark:text-brand-400">
                all your platforms
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Stop juggling separate projects. GPP scaffolds and manages web, API,
              CMS, mobile, and desktop apps in a unified structure. From idea to
              multi-platform app in minutes.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/docs/getting-started"
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Get started
              </Link>
              <a
                href="https://github.com/grasshopperpebbles/gpp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
              >
                View on GitHub <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="lg:pl-8">
            <div className="rounded-xl bg-gray-900 dark:bg-gray-800 shadow-2xl ring-1 ring-gray-900/10 dark:ring-white/10">
              <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-gray-400">Terminal</span>
              </div>
              <div className="p-4">
                <CodeBlock code={heroCode} language="bash" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
