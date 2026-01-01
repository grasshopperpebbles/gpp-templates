import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using our service",
};

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mt-2">Last updated: {lastUpdated}</p>
      </div>
      
      <div className="prose prose-zinc max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
          <p className="text-zinc-600">
            By accessing and using this website, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Use License</h2>
          <p className="text-zinc-600">
            Permission is granted to temporarily access the materials on this
            website for personal, non-commercial transitory viewing only.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">User Accounts</h2>
          <p className="text-zinc-600">
            You are responsible for maintaining the confidentiality of your account
            and password and for restricting access to your computer.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Prohibited Uses</h2>
          <p className="text-zinc-600">
            You may not use our service for any unlawful purpose or to solicit
            others to perform unlawful acts.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
          <p className="text-zinc-600">
            In no event shall we be liable for any damages arising out of the use
            or inability to use the materials on this website.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Changes to Terms</h2>
          <p className="text-zinc-600">
            We reserve the right to revise these terms at any time without notice.
            By using this website, you are agreeing to be bound by the current
            version of these terms.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Contact Information</h2>
          <p className="text-zinc-600">
            If you have any questions about these Terms of Service, please contact
            us through our <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
