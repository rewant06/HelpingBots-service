'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [open,      setOpen]      = useState(false);
  const [dropAlign, setDropAlign] = useState<'left' | 'right'>(align);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropRef      = useRef<HTMLDivElement>(null);

  // ── Flip alignment if dropdown would overflow the viewport ───────────────
  useLayoutEffect(() => {
    if (!open || !containerRef.current || !dropRef.current) return;
    const cRect       = containerRef.current.getBoundingClientRect();
    const dropWidth   = dropRef.current.scrollWidth;
    const vw          = window.innerWidth;

    if (align === 'left') {
      setDropAlign(cRect.left + dropWidth > vw - 8 ? 'right' : 'left');
    } else {
      setDropAlign(cRect.right - dropWidth < 8 ? 'left' : 'right');
    }
  }, [open, align]);

  // ── Close on outside click / touch ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const hasCount = count !== undefined && count > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex min-h-[36px] select-none items-center gap-1 rounded-full border border-border bg-muted',
          'px-3 py-1.5 text-xs font-medium text-foreground',
          'transition-all active:scale-[.97]',
          open       && 'border-primary/50 bg-primary/5 text-primary ring-1 ring-primary/20',
          hasCount   && !open && 'border-primary/40 bg-primary/5 text-primary',
        )}
      >
        <span className="max-w-[110px] truncate sm:max-w-[150px]">
          {label}{hasCount ? ` (${count})` : ''}
        </span>
        <ChevronDown
          className={cn('h-3 w-3 shrink-0 transition-transform duration-150', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={dropRef}
          role="listbox"
          className={cn(
            'absolute top-full z-30 mt-1.5 w-max min-w-[10rem]',
            // Never wider than viewport minus 1 rem margin on each side
            'max-w-[min(18rem,_calc(100vw_-_1rem))]',
            'max-h-72 overflow-y-auto overscroll-contain',
            'rounded-xl border border-border bg-popover p-2 shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            dropAlign === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── FilterOption ─────────────────────────────────────────────────────────────

interface FilterOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function FilterOption({ label, checked, onChange }: FilterOptionProps) {
  return (
    <label className="flex min-h-[40px] cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted active:bg-muted/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

// ─── SortDropdown ─────────────────────────────────────────────────────────────

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
    <FilterDropdown label={`Sort: ${current?.label ?? ''}`} align="right" className={className}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="option"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'block w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
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