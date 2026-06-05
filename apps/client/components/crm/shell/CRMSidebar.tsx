// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useCRMRole } from '@/lib/crm/role-context';
// import { ROLE_LABELS } from '@/lib/crm/permissions';
// import { CRM_ICON_MAP } from './icons';
// import type { Role } from '@/lib/crm/types';

// // Avatar background per role
// const AVATAR_BG: Record<Role, string> = {
//   super_admin:     'bg-primary text-primary-foreground',
//   admin:           'bg-secondary text-secondary-foreground',
//   team_lead:       'bg-orange-500 text-white',
//   marketing:       'bg-pink-500 text-white',
//   sales_executive: 'bg-blue-500 text-white',
//   support_agent:   'bg-emerald-500 text-white',
//   student:         'bg-sky-500 text-white',
// };

// function getInitials(name: string): string {
//   return name
//     .split(' ')
//     .map((n) => n[0])
//     .slice(0, 2)
//     .join('')
//     .toUpperCase();
// }

// export function CRMSidebar() {
//   const pathname = usePathname();
//   const { navItems, activeRole, currentUserName, currentUserEmail } = useCRMRole();

//   return (
//     <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">

//       {/* Brand mark */}
//       <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
//         <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
//           HB
//         </div>
//         <div className="min-w-0">
//           <p className="truncate text-sm font-semibold leading-none text-sidebar-foreground">
//             HelpingBots CRM
//           </p>
//           <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
//             {ROLE_LABELS[activeRole]}
//           </p>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="CRM navigation">
//         <ul className="space-y-0.5" role="list">
//           {navItems.map((item) => {
//             const Icon = CRM_ICON_MAP[item.iconName];
//             const isActive =
//               pathname === item.href ||
//               pathname.startsWith(item.href + '/');

//             return (
//               <li key={item.id}>
//                 <Link
//                   href={item.href}
//                   aria-current={isActive ? 'page' : undefined}
//                   className={[
//                     'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
//                     'transition-all duration-150',
//                     'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
//                     isActive
//                       ? 'bg-primary/10 text-primary'
//                       : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
//                   ].join(' ')}
//                 >
//                   {Icon && (
//                     <Icon
//                       className={`h-4 w-4 shrink-0 transition-colors ${
//                         isActive
//                           ? 'text-primary'
//                           : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
//                       }`}
//                       aria-hidden="true"
//                     />
//                   )}
//                   <span className="flex-1 truncate">{item.label}</span>
//                   {/* Badge */}
//                   {item.badge !== undefined && item.badge > 0 && (
//                     <span
//                       className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
//                       aria-label={`${item.badge} items`}
//                     >
//                       {item.badge > 99 ? '99+' : item.badge}
//                     </span>
//                   )}
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       {/* User identity footer */}
//       <div className="shrink-0 border-t border-sidebar-border p-3">
//         <div className="flex items-center gap-3 rounded-lg px-2 py-2">
//           <div
//             className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
//               AVATAR_BG[activeRole]
//             }`}
//             aria-hidden="true"
//           >
//             {getInitials(currentUserName)}
//           </div>
//           <div className="min-w-0 flex-1">
//             <p className="truncate text-sm font-medium leading-none text-sidebar-foreground">
//               {currentUserName}
//             </p>
//             <p className="mt-0.5 truncate text-xs leading-none text-muted-foreground">
//               {currentUserEmail}
//             </p>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRMRole } from '@/lib/crm/role-context';
import { ROLE_LABELS } from '@/lib/crm/permissions';
import { CRM_ICON_MAP } from './icons';
import type { Role } from '@/lib/crm/types';

const AVATAR_BG: Record<Role, string> = {
  super_admin: 'bg-primary text-primary-foreground',
  admin: 'bg-secondary text-secondary-foreground',
  team_lead: 'bg-orange-500 text-white',
  marketing: 'bg-pink-500 text-white',
  sales_executive: 'bg-blue-500 text-white',
  support_agent: 'bg-emerald-500 text-white',
  student: 'bg-sky-500 text-white',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CRMSidebar() {
  const pathname = usePathname();
  const { navItems, activeRole, currentUserName, currentUserEmail } = useCRMRole();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
            HB
          </div>
          <div className="min-w-0">
            <div className="h-3 w-28 rounded bg-muted/60" />
            <div className="mt-1 h-2.5 w-16 rounded bg-muted/40" />
          </div>
        </div>

        <div className="flex-1 px-2 py-3">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/40" />
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-muted/50" />
            <div className="min-w-0 flex-1">
              <div className="h-3 w-24 rounded bg-muted/60" />
              <div className="mt-1 h-2.5 w-32 rounded bg-muted/40" />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
          HB
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none text-sidebar-foreground">
            HelpingBots CRM
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
            {ROLE_LABELS[activeRole]}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="CRM navigation">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const Icon = CRM_ICON_MAP[item.iconName];
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                    'transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  ].join(' ')}
                >
                  {Icon && (
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
                      }`}
                      aria-hidden="true"
                    />
                  )}
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
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              AVATAR_BG[activeRole]
            }`}
            aria-hidden="true"
          >
            {getInitials(currentUserName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none text-sidebar-foreground">
              {currentUserName}
            </p>
            <p className="mt-0.5 truncate text-xs leading-none text-muted-foreground">
              {currentUserEmail}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}