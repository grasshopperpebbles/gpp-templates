import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our privacy policy and data protection practices",
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mt-2">Last updated: {lastUpdated}</p>
      </div>
      
      <div className="prose prose-zinc max-w-none">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p className="text-zinc-600">
            We collect information that you provide directly to us, including when
            you create an account, make a purchase, or contact us for support.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
          <p className="text-zinc-600">
            We use the information we collect to provide, maintain, and improve
            our services, process transactions, and communicate with you.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Information Sharing</h2>
          <p className="text-zinc-600">
            We do not sell, trade, or rent your personal information to third
            parties. We may share information only as described in this policy.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Data Security</h2>
          <p className="text-zinc-600">
            We implement appropriate security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Your Rights</h2>
          <p className="text-zinc-600">
            You have the right to access, update, or delete your personal
            information. Please contact us if you wish to exercise these rights.
          </p>
        </section>
        
        <section className="space-y-4 mt-8">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p className="text-zinc-600">
            If you have questions about this Privacy Policy, please contact us
            through our <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
