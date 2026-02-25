import { DocsSidebar } from "@/components/DocsSidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex gap-10">
        <DocsSidebar />
        <article className="flex-1 min-w-0 prose prose-gray dark:prose-invert max-w-none">
          {children}
        </article>
      </div>
    </div>
  );
}
