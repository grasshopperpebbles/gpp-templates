import type { Metadata } from 'next';
import '../lib/storyblok';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storyblok CMS Site',
  description: 'Built with Next.js and Storyblok',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

