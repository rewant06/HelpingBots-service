import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Play, Lock, Users, Check,
  ThumbsUp, ThumbsDown, Eye, Sparkles,
  Shield, Zap, Clock, GraduationCap,
} from 'lucide-react';


export const metadata: Metadata = {
  title: 'Live Product Demos | HelpingBots — No Login Required',
  description:
    'Try HelpingBots products live — no account needed. Explore the EdTech CRM with 7 RBAC roles and the VEIL anonymous feedback platform, right in your browser.',
  keywords: [
    'HelpingBots demo', 'EdTech CRM demo', 'VEIL anonymous demo',
    'live software demo no login', 'admissions CRM demo', 'anonymous feedback demo',
  ],
  alternates: { canonical: 'https://helpingbots.in/demo' },
  openGraph: {
    title: 'Try HelpingBots Products Live — No Login Required',
    description:
      'EdTech CRM (7 roles, full pipeline) + VEIL anonymous feedback platform. Fully interactive. Zero friction.',
    url: 'https://helpingbots.in/demo',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HelpingBots Product Demos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HelpingBots Live Demos',
    description: 'EdTech CRM + VEIL anonymous platform. Fully live, no account needed.',
    images: ['/og-image.png'],
  },
};

// ─── Structured Data ──────────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'HelpingBots Live Product Demos',
  description: 'Interactive live demos of HelpingBots software — no account required.',
  url: 'https://helpingbots.in/demo',
  publisher: { '@type': 'Organization', name: 'HelpingBots', url: 'https://helpingbots.in' },
  hasPart: [
    {
      '@type': 'SoftwareApplication',
      name: 'HelpingBots EdTech CRM',
      applicationCategory: 'BusinessApplication',
      url: 'https://helpingbots.in/crm',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'VEIL — The Truth Protocol',
      applicationCategory: 'CommunicationApplication',
      url: 'https://helpingbots.in/veil',
    },
  ],
};

// ─── CRM mini preview ─────────────────────────────────────────────────────────

function CRMPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl ring-1 ring-border/20">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-2 flex-1 rounded bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
          helpingbots.in/crm/dashboard
        </div>
      </div>

      <div className="flex" style={{ minHeight: '220px' }}>
        {/* Sidebar */}
        <div className="hidden w-28 shrink-0 border-r border-border bg-muted/30 p-2 sm:block">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <div className="h-4 w-4 rounded-md bg-primary/20" />
            <div className="h-2.5 w-12 rounded bg-muted-foreground/20" />
          </div>
          {['Dashboard', 'Leads', 'Tasks', 'Payments', 'Team'].map((item, i) => (
            <div
              key={item}
              className={`mb-1 flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 ${
                i === 0 ? 'bg-primary/10' : ''
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-sm ${
                  i === 0 ? 'bg-primary/50' : 'bg-muted-foreground/20'
                }`}
              />
              <span
                className={`text-[9px] font-medium ${
                  i === 0 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3">
          {/* KPI row */}
          <div className="mb-2.5 grid grid-cols-3 gap-1.5">
            {[
              { label: 'Active Leads', val: '19', color: 'text-foreground' },
              { label: 'Revenue', val: '₹14.8L', color: 'text-primary' },
              { label: 'Tasks Overdue', val: '2', color: 'text-red-500' },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-border bg-card p-1.5">
                <p className="text-[8px] text-muted-foreground">{card.label}</p>
                <p className={`mt-0.5 text-sm font-bold ${card.color}`}>{card.val}</p>
              </div>
            ))}
          </div>

          {/* Lead rows */}
          <div className="overflow-hidden rounded-lg border border-border">
            {[
              { name: 'Ananya Sharma', status: 'Interested',  color: 'bg-blue-100    text-blue-700    dark:bg-blue-900/40    dark:text-blue-300'    },
              { name: 'Rohan Mehta',   status: 'Follow Up',   color: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300'   },
              { name: 'Priya Singh',   status: 'Enrolled',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
            ].map((lead, i) => (
              <div
                key={lead.name}
                className={`flex items-center gap-2 px-2 py-1.5 ${
                  i < 2 ? 'border-b border-border/60' : ''
                }`}
              >
                <div className="h-5 w-5 shrink-0 rounded-full bg-primary/10" />
                <p className="min-w-0 flex-1 truncate text-[9px] font-semibold text-foreground">
                  {lead.name}
                </p>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${lead.color}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>

          {/* Role hint */}
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-2 py-1.5">
            <Users className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-[9px] font-medium text-primary">
              Switch between 7 roles · Super Admin → Student
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VEIL mini preview ────────────────────────────────────────────────────────

function VeilPreview() {
  return (
    <div className="space-y-2.5">
      {/* Post 1 — text */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-base select-none">
            🐺
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold">Anonymous Wolf</span>
              <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                <Lock className="h-2 w-2" aria-hidden="true" />
                Veiled
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground">3 minutes ago</p>
          </div>
        </div>
        <p className="mb-2.5 text-[11px] leading-relaxed text-foreground/80">
          &ldquo;The product roadmap needs complete transparency with the team.
          We&apos;re building in the dark.&rdquo;
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <ThumbsUp className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
            42
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            <ThumbsDown className="h-2.5 w-2.5" aria-hidden="true" />
            8
          </div>
          <div className="ml-auto inline-flex items-center gap-1 text-[9px] text-muted-foreground">
            <Eye className="h-2.5 w-2.5" aria-hidden="true" />
            234
          </div>
        </div>
      </div>

      {/* Post 2 — poll */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-base select-none">
            🐼
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold">CrypticPanda</span>
              <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                <Lock className="h-2 w-2" aria-hidden="true" />
                Veiled
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground">12 minutes ago</p>
          </div>
        </div>
        <p className="mb-2 text-[11px] font-medium text-foreground/80">
          Should we move to a 4-day work week?
        </p>
        <div className="mb-1.5 space-y-1.5">
          {[
            { label: 'Yes, absolutely', pct: 68 },
            { label: 'No, too risky',   pct: 32 },
          ].map((opt) => (
            <div key={opt.label} className="relative h-7 overflow-hidden rounded-md border border-border">
              <div
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${opt.pct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <span className="text-[10px] font-medium">{opt.label}</span>
                <span className="text-[10px] font-bold text-primary">{opt.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground">147 votes · Poll open</p>
      </div>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const CRM_FEATURES = [
  '7 RBAC roles — switch live inside the demo',
  '25 demo leads across all 10 pipeline stages',
  'Task management with overdue tracking',
  'Fee collection & instalment payment records',
  'Team leaderboards & analytics dashboards',
];

const VEIL_FEATURES = [
  'Zero-knowledge anonymity — real identities never exposed',
  'Sticky pseudonyms build reputation without a name',
  'Agree / Disagree sentiment voting on every post',
  'Anonymous polls with live result percentages',
  'AI moderation guardrails block harmful content',
];

const ACADEMY_FEATURES = [
  'Course builder with drag-and-drop curriculum',
  'Student progress tracking & module completions',
  'Live session scheduling & recordings',
  'AI-powered quiz & assessment generation',
  'Automated certificate generation',
];

// Extracted href constants — Turbopack does not allow template literals in JSX href
const CRM_DEMO_HREF    = '/crm';
const CRM_PRODUCT_HREF = '/products/crm';
const VEIL_DEMO_HREF   = '/veil';
const VEIL_PRODUCT_HREF = '/products/veil';
const WAITLIST_HREF    = 'mailto:hello@helpingbots.in?subject=Academy Waitlist';
const CONTACT_HREF     = 'mailto:hello@helpingbots.in';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen overflow-hidden">

        {/* ═══════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════ */}
        <section className="relative pb-16 pt-32">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-30"
            style={{ background: 'var(--gradient-mesh)' }}
          />
          <div className="pointer-events-none absolute left-1/4 top-16 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-32 -z-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

          <div className="container mx-auto px-4 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary">
                Fully Interactive · No Login Required
              </span>
            </div>

            <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              See the Products{' '}
              <span className="text-gradient">in Action</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Real data, real role switching, real features — every demo runs live in your browser.
              No forms, no credit cards, no waiting.
            </p>

            {/* Jump links */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {([
                { label: 'CRM',     href: '#crm',     live: true  },
                { label: 'VEIL',    href: '#veil',    live: true  },
                { label: 'Academy', href: '#academy', live: false },
              ] as const).map(({ label, href, live }) => (
                <a
                  key={label}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-muted"
                >
                  {live && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CRM DEMO
        ═══════════════════════════════════════════ */}
        <section id="crm" className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">

              {/* Header bar */}
              <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Live</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-bold text-foreground">HelpingBots CRM</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  EdTech Admissions
                </span>
              </div>

              <div className="grid lg:grid-cols-2">

                {/* Left — Info */}
                <div className="flex flex-col justify-between border-b border-border p-8 lg:border-b-0 lg:border-r">
                  <div>
                    <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                      EdTech CRM
                    </h2>
                    <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                      A production-grade CRM built for admissions teams — manage leads through
                      10 pipeline stages, assign tasks, collect fees, and measure team performance.
                      Switch between all 7 roles live, right in the demo.
                    </p>

                    <ul className="mb-8 space-y-2.5">
                      {CRM_FEATURES.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={CRM_DEMO_HREF}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Enter CRM Demo
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={CRM_PRODUCT_HREF}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted"
                    >
                      Product Details
                    </Link>
                  </div>
                </div>

                {/* Right — Preview */}
                <div className="flex items-center justify-center p-8">
                  <div className="w-full max-w-md">
                    <CRMPreview />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            VEIL DEMO
        ═══════════════════════════════════════════ */}
        <section id="veil" className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-violet-500/20 bg-card shadow-2xl">

              {/* Header bar */}
              <div className="flex items-center gap-4 border-b border-violet-500/15 bg-violet-500/5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Live</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-bold text-foreground">VEIL</span>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                  The Truth Protocol
                </span>
              </div>

              {/* Preview left, info right — flipped for visual rhythm */}
              <div className="grid lg:grid-cols-2">

                {/* Left — Preview (order-2 on mobile so info reads first) */}
                <div className="order-2 flex items-start justify-center border-t border-border p-8 lg:order-1 lg:border-r lg:border-t-0">
                  <div className="w-full max-w-sm">
                    <VeilPreview />
                  </div>
                </div>

                {/* Right — Info */}
                <div className="order-1 flex flex-col justify-between p-8 lg:order-2">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1">
                      <Lock className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
                      <span className="text-xs font-semibold text-violet-600">Anonymous by design</span>
                    </div>

                    <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                      VEIL
                    </h2>
                    <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                      Enterprise-grade infrastructure for anonymous feedback, whistleblowing, and
                      honest internal communities. Give your team a mask — and they&apos;ll tell
                      you the truth.
                    </p>

                    <ul className="mb-8 space-y-2.5">
                      {VEIL_FEATURES.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={VEIL_DEMO_HREF}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Open VEIL Feed
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={VEIL_PRODUCT_HREF}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted"
                    >
                      Product Details
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            COMING SOON — ACADEMY
        ═══════════════════════════════════════════ */}
        <section id="academy" className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-amber-500/20 bg-card shadow-lg">

              {/* Header bar */}
              <div className="flex items-center gap-4 border-b border-amber-500/15 bg-amber-500/5 px-6 py-4">
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-amber-600">
                  Coming Soon
                </span>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-bold text-foreground">HelpingBots Academy</span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                  Learning Management System
                </span>
              </div>

              <div className="grid md:grid-cols-2">
                {/* Info */}
                <div className="border-b border-border p-8 md:border-b-0 md:border-r">
                  <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                    Academy LMS
                  </h2>
                  <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                    A full-featured LMS for EdTech companies — from course creation to AI-powered
                    assessments and automated certificate generation.
                  </p>
                  <ul className="mb-6 space-y-2">
                    {ACADEMY_FEATURES.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={WAITLIST_HREF}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-bold text-amber-700 transition-all hover:bg-amber-500/20"
                  >
                    Join the Waitlist
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                {/* Mock preview */}
                <div className="flex items-center justify-center p-8">
                  <div className="w-full max-w-xs space-y-3 opacity-60">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                          <GraduationCap className="h-5 w-5 text-amber-600" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="h-2.5 w-32 rounded bg-muted-foreground/20" />
                          <div className="mt-1.5 h-2 w-20 rounded bg-muted-foreground/10" />
                        </div>
                      </div>
                      <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-3/4 rounded-full bg-amber-500/60" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">74% complete</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        <span className="text-[11px] font-semibold text-foreground">AI Quiz — Module 4</span>
                      </div>
                      {['Option A', 'Option B', 'Option C'].map((opt, i) => (
                        <div
                          key={opt}
                          className={`mb-1 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                            i === 1
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-border/50'
                          }`}
                        >
                          <div
                            className={`h-3 w-3 rounded-full border-2 ${
                              i === 1
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-muted-foreground/30'
                            }`}
                          />
                          <span className="text-[10px] text-foreground/70">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM CTA
        ═══════════════════════════════════════════ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 px-10 py-14 text-center shadow-elevated">
              <div className="pointer-events-none absolute left-0 top-0 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

              <Zap className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Ready to build with HelpingBots?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
                From demo to production in days. Our team can deploy a customised version of
                any product for your organisation.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href={CONTACT_HREF}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90"
                >
                  Get in Touch
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}