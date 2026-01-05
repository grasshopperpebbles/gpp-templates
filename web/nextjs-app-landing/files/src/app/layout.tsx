import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // TODO: Update with your app's metadata
  title: "Your App Name - Download for iOS & Android",
  description:
    "Your app description. Explain what your app does and why users should download it.",
  keywords: ["app", "mobile", "ios", "android"],
  openGraph: {
    title: "Your App Name",
    description: "Your app description for social sharing",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your App Name",
    description: "Your app description for Twitter",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
