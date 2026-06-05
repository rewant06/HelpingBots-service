'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, ChevronDown, Sparkles, ArrowLeft } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_ORDER } from '@/lib/crm/permissions';
import type { Role } from '@/lib/crm/types';

const ROLE_CHIP: Record<Role, string> = {
  super_admin:     'bg-primary/10 text-primary border-primary/30',
  admin:           'bg-secondary text-secondary-foreground border-border',
  team_lead:       'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  marketing:       'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  sales_executive: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  support_agent:   'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  student:         'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
};

const ROLE_DOT: Record<Role, string> = {
  super_admin:     'bg-primary',
  admin:           'bg-slate-500',
  team_lead:       'bg-orange-500',
  marketing:       'bg-pink-500',
  sales_executive: 'bg-blue-500',
  support_agent:   'bg-emerald-500',
  student:         'bg-sky-500',
};

const PAGE_TITLES: Record<string, string> = {
  dashboard:   'Dashboard',
  leads:       'Leads',
  tasks:       'Tasks',
  payments:    'Payments',
  imports:     'Import Center',
  team:        'Team',
  leaderboard: 'Leaderboard',
  analytics:   'Analytics',
  settings:    'Settings',
  portal:      'My Portal',
};

export function CRMTopBar() {
  const { activeRole, setActiveRole, currentUserName } = useCRMRole();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = useMemo(() => {
    const last = pathname.split('/').filter(Boolean).at(-1) ?? '';
    return PAGE_TITLES[last] ?? 'CRM';
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  function handleSelect(role: Role) {
    setActiveRole(role);
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:gap-4 sm:px-5">

      {/* ── Left: Exit + Page Title ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground"
          aria-label="Exit CRM Demo"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Exit Demo</span>
        </Link>

        <div className="h-4 w-px bg-border" aria-hidden="true" />

        <h1 className="truncate text-sm font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right: Controls ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2">

        {/* Demo badge — hidden on mobile */}
        <div className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 sm:flex">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-primary">Demo</span>
        </div>

        {/* Role Switcher */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={'Active role: ' + ROLE_LABELS[activeRole] + '. Click to switch.'}
            className={[
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              ROLE_CHIP[activeRole],
            ].join(' ')}
          >
            <span
              className={'h-1.5 w-1.5 shrink-0 rounded-full ' + ROLE_DOT[activeRole]}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{ROLE_LABELS[activeRole]}</span>
            <span className="sm:hidden">Role</span>
            <ChevronDown
              className={'h-3 w-3 shrink-0 transition-transform duration-150 ' + (isOpen ? 'rotate-180' : '')}
              aria-hidden="true"
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              role="listbox"
              aria-label="Select demo role"
              className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-scale-in"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Switch Demo Role
                </p>
              </div>

              <ul className="p-1" role="presentation">
                {ROLE_ORDER.map((role) => {
                  const isActive = role === activeRole;
                  return (
                    <li key={role}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => handleSelect(role)}
                        className={[
                          'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left',
                          'transition-colors duration-100',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isActive ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
                        ].join(' ')}
                      >
                        <span
                          className={'mt-1 h-2 w-2 shrink-0 rounded-full ' + ROLE_DOT[role]}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                            {isActive && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {ROLE_DESCRIPTIONS[role]}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Viewing as{' '}
                  <span className="font-semibold text-foreground">{currentUserName}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications (demo)"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}