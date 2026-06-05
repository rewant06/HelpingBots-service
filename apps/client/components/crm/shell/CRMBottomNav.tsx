// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useCRMRole } from '@/lib/crm/role-context';
// import { CRM_ICON_MAP } from './icons';

// const MAX_MOBILE_ITEMS = 5;

// export function CRMBottomNav() {
//   const pathname = usePathname();
//   const { navItems } = useCRMRole();

//   // Take only the first MAX_MOBILE_ITEMS — most important come first in NAV_ITEMS
//   const mobileItems = navItems.slice(0, MAX_MOBILE_ITEMS);

//   return (
//     <nav
//       aria-label="Mobile navigation"
//       className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
//     >
//       {mobileItems.map((item) => {
//         const Icon = CRM_ICON_MAP[item.iconName];
//         const isActive =
//           pathname === item.href || pathname.startsWith(item.href + '/');

//         return (
//           <Link
//             key={item.id}
//             href={item.href}
//             aria-current={isActive ? 'page' : undefined}
//             aria-label={item.label}
//             className={[
//               'flex flex-1 flex-col items-center justify-center gap-1 px-1',
//               'transition-colors duration-150',
//               'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
//               isActive
//                 ? 'text-primary'
//                 : 'text-muted-foreground hover:text-foreground',
//             ].join(' ')}
//           >
//             <div className="relative">
//               {Icon && (
//                 <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
//               )}
//               {item.badge !== undefined && item.badge > 0 && (
//                 <span
//                   className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground"
//                   aria-label={`${item.badge} items`}
//                 >
//                   {item.badge > 9 ? '9+' : item.badge}
//                 </span>
//               )}
//             </div>
//             <span className="text-[10px] font-medium leading-none">
//               {item.label}
//             </span>
//           </Link>
//         );
//       })}
//     </nav>
//   );
// }

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { CRM_ICON_MAP } from './icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const MAX_PRIMARY_MOBILE_ITEMS = 4;

export function CRMBottomNav() {
  const pathname = usePathname();
  const { navItems } = useCRMRole();

  const primaryItems = navItems.slice(0, MAX_PRIMARY_MOBILE_ITEMS);
  const overflowItems = navItems.slice(MAX_PRIMARY_MOBILE_ITEMS);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
    >
      {primaryItems.map((item) => {
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
              {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground"
                  aria-label={`${item.badge} items`}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="max-w-full truncate text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}

      {overflowItems.length > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open more navigation options"
              className={[
                'flex flex-1 flex-col items-center justify-center gap-1 px-1',
                'text-muted-foreground transition-colors duration-150 hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              ].join(' ')}
            >
              <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
            <SheetTitle>More options</SheetTitle>
            <SheetDescription>
              Additional CRM sections available for this role.
            </SheetDescription>

            <div className="mt-4 space-y-2 overflow-y-auto pb-4">
              {overflowItems.map((item) => {
                const Icon = CRM_ICON_MAP[item.iconName];
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}

                    <span className="flex-1 truncate">{item.label}</span>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                        aria-label={`${item.badge} items`}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
}