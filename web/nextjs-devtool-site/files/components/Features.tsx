const features = [
  {
    name: "Multi-Platform",
    description:
      "Web (Next.js), API (FastAPI, Express, Rust), CMS (WordPress, Strapi), Mobile (Flutter, Expo), Desktop (Electron, Tauri), and Workers.",
    icon: "🌐",
  },
  {
    name: "Unified Structure",
    description:
      "All platforms live under apps/ with consistent configuration in .gpp/. One project, one structure.",
    icon: "📁",
  },
  {
    name: "Platform Control",
    description:
      "Start, stop, restart, and build any platform from the root. No more cd-ing into directories.",
    icon: "🎮",
  },
  {
    name: "Template System",
    description:
      "Extensible templates from filesystem or GitHub. Install community templates or create your own.",
    icon: "📦",
  },
  {
    name: "Platform Wiring",
    description:
      "Connect platforms together with adapters. Wire your mobile app to your API with one command.",
    icon: "🔌",
  },
  {
    name: "Plan & Apply",
    description:
      "Preview changes with --dry-run before applying. See exactly what will happen.",
    icon: "📋",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-600 dark:text-brand-400">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            One toolkit for all your platforms
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Stop juggling multiple tools and configurations. GPP gives you a
            unified workflow for modern multi-platform development.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/50 text-2xl">
                    {feature.icon}
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
