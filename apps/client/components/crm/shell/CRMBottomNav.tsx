'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRMRole } from '@/lib/crm/role-context';
import { CRM_ICON_MAP } from './icons';

const MAX_MOBILE_ITEMS = 5;

export function CRMBottomNav() {
  const pathname = usePathname();
  const { navItems } = useCRMRole();

  // Take only the first MAX_MOBILE_ITEMS — most important come first in NAV_ITEMS
  const mobileItems = navItems.slice(0, MAX_MOBILE_ITEMS);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
    >
      {mobileItems.map((item) => {
        const Icon = CRM_ICON_MAP[item.iconName];
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className={[
              'flex flex-1 flex-col items-center justify-center gap-1 px-1',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <div className="relative">
              {Icon && (
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground"
                  aria-label={`${item.badge} items`}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}