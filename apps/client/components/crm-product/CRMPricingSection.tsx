'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Pricing data ─────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for small institutes',
    priceINR: 4999,
    priceUSD: 59,
    period: '/month',
    highlight: false,
    ctaLabel: 'Start Free Trial',
    ctaHref: 'mailto:hello@helpingbots.in?subject=Starter Plan Enquiry',
    features: [
      'Up to 5 team members',
      '500 leads / month',
      '10-stage pipeline',
      'Task & follow-up tracking',
      'Basic payment records',
      'Mobile-responsive CRM',
      'Email support (48hr)',
    ],
    notIncluded: [
      'Marketing attribution',
      'Team leaderboards',
      'Advanced analytics',
      'WhatsApp integration',
      'API access',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Most popular for growing teams',
    priceINR: 12999,
    priceUSD: 149,
    period: '/month',
    highlight: true,
    ctaLabel: 'Get Started',
    ctaHref: 'mailto:hello@helpingbots.in?subject=Professional Plan Enquiry',
    features: [
      'Up to 20 team members',
      'Unlimited leads',
      'All 10 pipeline stages',
      'Task & follow-up tracking',
      'Full payment + instalment tracking',
      'Marketing attribution (generatedBy)',
      'Team leaderboards & boards',
      'WhatsApp integration',
      'Advanced analytics & reports',
      'Priority support (24hr)',
      'Import via CSV',
      'Custom pipeline stages',
    ],
    notIncluded: [
      'White-label branding',
      'Dedicated account manager',
      'On-premise deployment',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large or multi-branch institutes',
    priceINR: null,
    priceUSD: null,
    period: null,
    highlight: false,
    ctaLabel: 'Contact Sales',
    ctaHref: 'mailto:hello@helpingbots.in?subject=Enterprise CRM Enquiry',
    features: [
      'Unlimited team members',
      'Unlimited leads & storage',
      'Multi-branch / multi-campus',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations (ERP, LMS, etc.)',
      'REST API + webhooks',
      'On-premise deployment option',
      'SLA guarantee (99.9% uptime)',
      'Training & onboarding',
      '1hr priority support',
    ],
    notIncluded: [],
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function CRMPricingSection() {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            No hidden fees. Cancel anytime. All plans include a 14-day free trial.
          </p>

          {/* Currency toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
            {(['INR', 'USD'] as const).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200',
                  currency === cur
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {cur === 'INR' ? '₹ INR' : '$ USD'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tier cards ─────────────────────────────────────────────────── */}
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300',
                tier.highlight
                  ? 'border-primary/50 bg-gradient-to-b from-primary/5 to-background shadow-2xl ring-1 ring-primary/20 scale-[1.02]'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-lg',
              )}
            >
              {/* Popular badge */}
              {tier.highlight && (
                <div className="absolute left-0 right-0 top-0 flex items-center justify-center bg-primary py-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                    <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                    Most Popular
                    <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  </span>
                </div>
              )}

              <div className={cn('flex flex-1 flex-col p-6', tier.highlight && 'pt-10')}>

                {/* Tier name */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6 border-b border-border pb-6">
                  {tier.priceINR !== null ? (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {currency === 'INR'
                          ? `₹${tier.priceINR.toLocaleString('en-IN')}`
                          : `$${tier.priceUSD}`}
                      </span>
                      <span className="mb-1.5 text-sm text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-foreground">
                        Custom
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tailored to your scale
                      </p>
                    </div>
                  )}
                  {tier.priceINR !== null && currency === 'INR' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ ${tier.priceUSD}/mo · Billed monthly · GST extra
                    </p>
                  )}
                  {tier.priceINR !== null && currency === 'USD' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ ₹{tier.priceINR.toLocaleString('en-IN')}/mo · Billed monthly
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {tier.notIncluded.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground/50 line-through"
                    >
                      <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">–</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                    tier.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
                      : 'border border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {tier.highlight && <Zap className="h-4 w-4" aria-hidden="true" />}
                  {tier.ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

              </div>
            </div>
          ))}
        </div>

        {/* ── Money-back note ─────────────────────────────────────────────── */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include a{' '}
          <span className="font-semibold text-foreground">14-day free trial</span>.
          No credit card required. Cancel anytime.{' '}
          <Link href="mailto:hello@helpingbots.in" className="text-primary hover:underline">
            Questions? Talk to us →
          </Link>
        </p>

      </div>
    </section>
  );
}