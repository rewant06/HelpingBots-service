'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

interface CRMDemoEntryProps {
  /** Render as a full pill button (for landing page hero / navbar CTA area) */
  variant?: 'button' | 'link';
  className?: string;
}

export function CRMDemoEntry({
  variant = 'button',
  className = '',
}: CRMDemoEntryProps) {
  if (variant === 'link') {
    return (
      <Link
        href="/crm"
        className={[
          'flex items-center gap-1.5 text-sm font-medium',
          'text-muted-foreground transition-colors hover:text-foreground',
          className,
        ].join(' ')}
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        CRM Demo
      </Link>
    );
  }

  return (
    <Link
      href="/crm"
      className={[
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold',
        'bg-primary text-primary-foreground',
        'shadow-sm transition-all duration-200',
        'hover:opacity-90 hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      ].join(' ')}
    >
      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
      Try CRM Demo
    </Link>
  );
}