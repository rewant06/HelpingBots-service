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
    template: "%s | Helping Bots",
  },
  description: "HelpingBots offers premium software development services and hosts VEIL, the anonymous truth protocol. Secure, scalable, and built for the future.",
  
  // UPDATED KEYWORDS (Expanded for Typos & Singulars)
  keywords: [
    "Helping Bots",       
    "Helping bots",         
    "HelpingBots",        
    "Helping Bot",           
    "Helping bot",          
    "HelpingBot",            
    "Software Development", 
    "Anonymous Social Network", 
    "VEIL Protocol", 
    "Next.js Agency", 
    "HelpingBots Agency",    
    "Secure Feedback"
  ],
  
  authors: [{ name: "Rewant Raj" }],
  creator: "Rewant Raj",
  publisher: "HelpingBots",
  
  // SOCIAL SHARING (OpenGraph)
  openGraph: {
    title: "HelpingBots - The Future of Digital Interaction",
    description: "Production-ready software services and anonymous social interactions powered by VEIL.",
    url: "https://helpingbots.in",
    siteName: "HelpingBots",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Helping Bots Platform",
      },
    ],
  },
  
  // TWITTER CARD
  twitter: {
    card: "summary",
    title: "HelpingBots",
    description: "Production-ready software & VEIL Protocol.",
    images: ["/android-chrome-512x512.png"],
  },

  // ICONS & MANIFEST
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/apple-touch-icon.png',
      },
    ],
  },
  
  manifest: '/site.webmanifest',

  // ROBOTS
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