import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about us",
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">About Us</h1>
      
      <div className="prose prose-zinc max-w-none">
        <p className="text-zinc-600">
          Welcome to our website. We are committed to providing quality services
          and building meaningful connections with our community.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p className="text-zinc-600">
          Our mission is to deliver exceptional value and create positive impact
          through our work.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
        <ul className="list-disc pl-6 space-y-2 text-zinc-600">
          <li>Integrity and transparency</li>
          <li>Customer-focused approach</li>
          <li>Continuous improvement</li>
          <li>Innovation and creativity</li>
        </ul>
      </div>
    </div>
  );
}
