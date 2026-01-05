/**
 * App Landing Page Content Configuration
 *
 * This file contains all the content for your app landing page.
 * Replace the placeholder content with your actual app information.
 *
 * TIP: Use `gpp generate content app-landing` to auto-generate content
 * based on your project documentation (README.md, DEVELOPMENT.md, etc.)
 */

import {
  Smartphone,
  Zap,
  Shield,
  Cloud,
  Bell,
  Users,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// APP CONFIGURATION
// TODO: Replace with your app's actual information
// =============================================================================
export const APP_CONFIG = {
  name: "Your App Name",
  tagline: "Your catchy tagline goes here (5-10 words)",
  description:
    "A compelling description of what your app does and the main benefit it provides to users. Focus on the problem it solves and the value it delivers. Keep it to 1-2 sentences.",
  heroImage: "/images/screenshots/hero.png", // Optional: main app screenshot
};

// =============================================================================
// FEATURES
// TODO: Highlight 4-6 key features of your app
// TIP: Focus on benefits, not just features. How does each help the user?
// =============================================================================
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
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

// =============================================================================
// SCREENSHOTS
// TODO: Add 3-5 screenshots of your app
// TIP: Show the most impressive screens first. Include captions.
// Place images in: public/images/screenshots/
// =============================================================================
export interface Screenshot {
  src: string;
  alt: string;
  caption: string;
}

export const SCREENSHOTS: Screenshot[] = [
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

// =============================================================================
// TESTIMONIALS
// TODO: Add 3 customer testimonials
// TIP: Include name, role/company, and rating (1-5 stars)
// =============================================================================
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
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
    quote: "The best investment I've made this year. Worth every penny.",
    author: "Emily Davis",
    role: "Entrepreneur",
    rating: 5,
  },
];

// =============================================================================
// FAQ
// TODO: Add 4-6 frequently asked questions
// TIP: Answer common questions about pricing, platforms, security, and support
// =============================================================================
export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
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

// =============================================================================
// CTA (Call to Action)
// TODO: Customize the final call-to-action section
// =============================================================================
export const CTA_CONFIG = {
  headline: "Ready to get started?",
  subheadline: "Download the app now and join thousands of satisfied users.",
};
