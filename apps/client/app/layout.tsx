import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";


export const metadata: Metadata = {
  metadataBase: new URL('https://helpingbots.in'),

  title: {
    default: "HelpingBots | EdTech CRM & Custom Software Development",
    template: "%s | HelpingBots",
  },

  description:
    "HelpingBots builds production-ready software for education businesses — including our flagship EdTech CRM for admissions, lead management, and student onboarding. Also home to VEIL, an anonymous social protocol.",

  keywords: [
    // Brand variations
    "HelpingBots", "Helping Bots", "helpingbots.in",
    // Core services
    "EdTech CRM", "EdTech software", "admissions management software",
    "lead management for education", "student CRM", "education technology",
    "enrollment management system", "admissions CRM",
    // Dev services
    "custom software development", "Next.js development agency",
    "full-stack development India", "SaaS development",
    // VEIL product
    "VEIL Protocol", "anonymous social network", "anonymous feedback platform",
    // Location
    "software development Bangalore", "IT company India",
  ],

  authors:   [{ name: "Rewant Raj", url: "https://helpingbots.in" }],
  creator:   "Rewant Raj",
  publisher: "HelpingBots",

  openGraph: {
    title:       "HelpingBots — EdTech CRM & Custom Software",
    description: "Production-ready EdTech CRM for admissions teams + VEIL anonymous social protocol. Built by HelpingBots.",
    url:         "https://helpingbots.in",
    siteName:    "HelpingBots",
    locale:      "en_IN",
    type:        "website",
    images: [
      {
        url:    "/og-image.png",            // place a 1200×630 OG image here
        width:  1200,
        height: 630,
        alt:    "HelpingBots — EdTech CRM & Software Development",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@helpingbots",
    title:       "HelpingBots — EdTech CRM & Custom Software",
    description: "Production-ready admissions CRM + anonymous social protocol built for India.",
    images:      ["/og-image.png"],
  },

  icons: {
    icon: [
      { url: '/favicon.ico',       sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },

  manifest: '/site.webmanifest',

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  alternates: {
    canonical: "https://helpingbots.in",
  },

  verification: {
    // Add your Google Search Console verification token here when available
    // google: "YOUR_VERIFICATION_TOKEN",
  },
};

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type":    "Organization",
  name:       "HelpingBots",
  url:        "https://helpingbots.in",
  logo:       "https://helpingbots.in/android-chrome-512x512.png",
  description:
    "HelpingBots builds production-ready EdTech CRM software and custom digital solutions for education businesses across India.",
  sameAs: [
    // Add your social profile URLs when available
    // "https://twitter.com/helpingbots",
    // "https://linkedin.com/company/helpingbots",
  ],
  contactPoint: {
    "@type":             "ContactPoint",
    contactType:         "customer support",
    email:               "support@helpingbots.in",
    availableLanguage:   ["English", "Hindi"],
  },
  founder: {
    "@type": "Person",
    name:    "Rewant Raj",
  },
};

const softwareSchema = {
  "@context":    "https://schema.org",
  "@type":       "SoftwareApplication",
  name:          "HelpingBots EdTech CRM",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A production-grade CRM built specifically for EdTech admissions teams — with role-based access, lead pipeline management, student onboarding, and payment tracking.",
  offers: {
    "@type":    "Offer",
    price:      "0",
    priceCurrency: "INR",
    description: "Live interactive demo available free",
  },
  url: "https://helpingbots.in/crm",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Structured data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        {/* Prevent horizontal scroll on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}