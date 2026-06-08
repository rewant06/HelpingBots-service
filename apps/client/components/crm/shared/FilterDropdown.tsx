'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterDropdownProps {
  label: string;
  count?: number;
  align?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

export function FilterDropdown({
  label,
  count,
  align = 'left',
  className,
  children,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          // min-h so tap target is ≥ 32 px on touch
          'flex min-h-[32px] items-center gap-1 rounded-full border border-border bg-muted',
          'px-3 py-1.5 text-xs font-medium text-foreground',
          'select-none transition-colors hover:bg-muted/80 active:scale-[.97]',
          open && 'border-primary/40 bg-primary/5 text-primary ring-2 ring-primary/10',
        )}
      >
        <span className="truncate max-w-[140px]">
          {label}
          {count !== undefined && count > 0 ? ` (${count})` : ''}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            'absolute top-full z-30 mt-1.5 max-h-72 min-w-[11rem] overflow-y-auto overscroll-contain',
            'rounded-xl border border-border bg-popover p-2 shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── FilterOption ─────────────────────────────────────────────────────────────
// Convenience checkbox row for use inside FilterDropdown.

interface FilterOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function FilterOption({ label, checked, onChange }: FilterOptionProps) {
  return (
    <label className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted active:bg-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded accent-primary"
      />
      <span className="select-none">{label}</span>
    </label>
  );
}

// ─── SortDropdown ─────────────────────────────────────────────────────────────
// Single-select sort variant — used for the "Sort: …" button.

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SortDropdown<T extends string>({
  value,
  options,
  onChange,
  className,
}: SortDropdownProps<T>) {
  const current = options.find((o) => o.value === value);

  return (
    <FilterDropdown
      label={`Sort: ${current?.label ?? ''}`}
      align="right"
      className={className}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
            opt.value === value
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground hover:bg-muted',
          )}
        >
          {opt.label}
        </button>
      ))}
    </FilterDropdown>
  );
}