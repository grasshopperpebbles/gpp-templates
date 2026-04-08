import type { Metadata } from "next";
import "./globals.css";
import { getServerSession } from "next-auth";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/feedback/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authOptions } from "@/lib/auth-config";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Admin Dashboard";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? "Platform administration dashboard";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yoursite.dev";

export const metadata: Metadata = {
  title: siteName,
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="antialiased">
        <Providers session={session}>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
