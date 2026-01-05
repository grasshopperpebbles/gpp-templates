import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sanity CMS Site',
  description: 'Built with Next.js and Sanity',
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

