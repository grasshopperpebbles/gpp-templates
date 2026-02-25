import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Your Project - Tagline Here",
    template: "%s | Your Project",
  },
  description: "Your project description goes here.",
  keywords: ["your", "keywords", "here"],
  // TODO: Update metadataBase with your domain
  metadataBase: new URL("https://yoursite.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yoursite.dev",
    siteName: "Your Project",
    title: "Your Project - Tagline Here",
    description: "Your project description goes here.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Your Project",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Project - Tagline Here",
    description: "Your project description goes here.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-950 antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
