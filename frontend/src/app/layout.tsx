import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EdVisor - Find Your Perfect Mentor",
    template: "%s | EdVisor"
  },
  description: "Connect with expert mentors for personalized learning, career guidance, and skill development. Join thousands of students learning from industry experts.",
  keywords: ["mentoring", "career guidance", "online tutoring", "skill development", "learning platform", "expert mentors"],
  authors: [{ name: "EdVisor Team" }],
  creator: "EdVisor",
  publisher: "EdVisor",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'EdVisor - Find Your Perfect Mentor',
    description: 'Connect with expert mentors for personalized learning and career guidance',
    siteName: 'EdVisor',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EdVisor - Mentoring Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EdVisor - Find Your Perfect Mentor',
    description: 'Connect with expert mentors for personalized learning and career guidance',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // other: {
    //   'facebook-domain-verification': 'your-facebook-verification-code',
    // },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
