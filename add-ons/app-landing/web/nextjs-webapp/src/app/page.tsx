import {
  Hero,
  Features,
  Screenshots,
  Testimonials,
  FAQ,
  DownloadButtons,
} from "@/components/app-landing";
import {
  Smartphone,
  Zap,
  Shield,
  Cloud,
  Bell,
  Users,
} from "lucide-react";

// TODO: Replace with your app's actual data
const APP_CONFIG = {
  name: "Your App Name",
  tagline: "Your app tagline goes here",
  description:
    "A brief description of what your app does and the main benefit it provides to users. Keep it concise but compelling.",
  heroImage: "/images/screenshots/hero.png", // Optional
};

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized performance ensures your experience is smooth and responsive.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Your data is protected with industry-leading security measures.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Access your data from anywhere with seamless cloud synchronization.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with intelligent notifications that matter to you.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Work together with friends, family, or colleagues effortlessly.",
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description:
      "Available on iOS and Android with feature parity across platforms.",
  },
];

const SCREENSHOTS = [
  {
    src: "/images/screenshots/screen1.png",
    alt: "Main dashboard",
    caption: "Your personalized dashboard",
  },
  {
    src: "/images/screenshots/screen2.png",
    alt: "Feature view",
    caption: "Powerful features at your fingertips",
  },
  {
    src: "/images/screenshots/screen3.png",
    alt: "Settings",
    caption: "Customize to your preferences",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "This app has completely transformed how I work. I can't imagine going back to the old way.",
    author: "Sarah Johnson",
    role: "Product Designer",
    rating: 5,
  },
  {
    quote:
      "Simple, intuitive, and powerful. Everything I was looking for in an app.",
    author: "Michael Chen",
    role: "Software Engineer",
    rating: 5,
  },
  {
    quote:
      "The best investment I've made this year. Worth every penny.",
    author: "Emily Davis",
    role: "Entrepreneur",
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    question: "Is the app free to use?",
    answer:
      "Yes, the app is free to download and use with core features. Premium features are available through an optional subscription.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "The app is available on both iOS (iPhone and iPad) and Android devices. We also have a web version for desktop access.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply download the app from the App Store or Google Play, create an account, and you're ready to go! Our onboarding will guide you through the key features.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security practices to protect your data. Your privacy is our top priority.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can reach our support team through the app's Help section, or email us at support@yourapp.com. We typically respond within 24 hours.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero
        appName={APP_CONFIG.name}
        tagline={APP_CONFIG.tagline}
        description={APP_CONFIG.description}
        heroImage={APP_CONFIG.heroImage}
      />

      <Features features={FEATURES} />

      <Screenshots screenshots={SCREENSHOTS} />

      <Testimonials testimonials={TESTIMONIALS} />

      <FAQ items={FAQ_ITEMS} />

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Download the app now and join thousands of satisfied users.
          </p>
          <div className="mt-8">
            <DownloadButtons />
          </div>
        </div>
      </section>
    </main>
  );
}
