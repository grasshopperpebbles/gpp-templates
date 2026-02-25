import Link from "next/link";
import { CodeBlock } from "./CodeBlock";

const installCode = `# Install globally (recommended)
npm install -g gpp-cli

# Or use npx
npx gpp-cli init my-project`;

export function QuickStart() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Get started in seconds
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Install GPP and create your first multi-platform project.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-xl bg-gray-900 dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="p-4">
              <CodeBlock code={installCode} language="bash" />
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
            >
              Read the docs
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
