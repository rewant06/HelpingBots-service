import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

// ENHANCED METADATA
export const metadata: Metadata = {
  metadataBase: new URL('https://helpingbots.in'),
  title: {
    default: "HelpingBots | Production-Ready Software & Anonymous Social Platform",
    template: "%s | HelpingBots",
  },
  description: "HelpingBots offers premium software development services and hosts VEIL, the anonymous truth protocol. Secure, scalable, and built for the future.",
  keywords: ["Software Development", "Anonymous Social Network", "VEIL Protocol", "Next.js Agency", "HelpingBots", "Secure Feedback"],
  authors: [{ name: "Rewant Raj" }],
  creator: "Rewant Raj",
  publisher: "HelpingBots",
  openGraph: {
    title: "HelpingBots - The Future of Digital Interaction",
    description: "Production-ready software services and anonymous social interactions powered by VEIL.",
    url: "https://helpingbots.in",
    siteName: "HelpingBots",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png", // Ensure you add an image at /public/og-image.png for social cards
        width: 800,
        height: 800,
        alt: "HelpingBots Platform",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HelpingBots",
    description: "Production-ready software & VEIL Protocol.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}