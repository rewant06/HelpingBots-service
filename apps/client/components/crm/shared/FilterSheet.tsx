'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="border-b border-border px-4 py-4 last:border-0">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface OptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function Option({ label, checked, onChange }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FilterSheetProps {
  /** Number of active filters — shown as badge on trigger button. */
  activeCount: number;
  /** Called when user taps "Clear all" in the sheet. */
  onClear: () => void;
  /** Filter sections — use <FilterSheet.Section> + <FilterSheet.Option>. */
  children: ReactNode;
}

export function FilterSheet({ activeCount, onClear, children }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
          activeCount > 0
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background text-foreground hover:bg-muted',
        )}
        aria-label={`Filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
      >
        <Filter className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* ── Sheet + backdrop ─────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet — slides up from bottom */}
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filter options"
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-background shadow-2xl animate-slide-up"
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Filters</h2>
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable filter sections */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>

            {/* Pinned footer */}
            <div className="flex gap-3 border-t border-border p-4">
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false); }}
                className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Attach sub-components for dot-notation usage
FilterSheet.Section = Section;
FilterSheet.Option  = Option;