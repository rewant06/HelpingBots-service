import type { Metadata } from 'next';
import { CRMRoleProvider } from '@/lib/crm/role-context';
import { CRMTopBar }    from '@/components/crm/shell/CRMTopBar';
import { CRMSidebar }   from '@/components/crm/shell/CRMSidebar';
import { CRMBottomNav } from '@/components/crm/shell/CRMBottomNav';

export const metadata: Metadata = {
  title: {
    default:  'HelpingBots CRM Demo',
    template: '%s | HelpingBots CRM',
  },
  description:
    'Interactive EdTech CRM demo — 7 RBAC roles, 25 leads, full admissions pipeline with marketing & sales boards. Built by HelpingBots.',
  // CRM demo pages are indexed so they appear in Google and demonstrate the product
  robots: { index: true, follow: true },
  openGraph: {
    title:       'HelpingBots CRM Demo',
    description: 'Explore a production-grade EdTech CRM with 7 RBAC roles, lead management, task tracking, payments, and a student portal.',
    type:        'website',
  },
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMRoleProvider>
      {/* Marketing navbar/footer are suppressed via pathname guard in Navbar/Footer */}
      <div className="flex min-h-screen w-full flex-col">
        <CRMTopBar />
        <div className="flex flex-1 overflow-hidden">
          <CRMSidebar />
          <main
            id="crm-main-content"
            className={[
              'flex-1 min-w-0 overflow-y-auto',
              // Horizontal padding
              'px-4 sm:px-6',
              // Vertical padding: top normal, bottom large on mobile to clear the
              // fixed bottom nav (h-16 = 64px) + iOS home-indicator safe area.
              // pb-28 (112px) gives enough clearance on all devices.
              // On lg+, the bottom nav is hidden so pb-6 is sufficient.
              'pt-4 sm:pt-6',
              'pb-28 lg:pb-6',
            ].join(' ')}
          >
            {children}
          </main>
        </div>
      </div>
      <CRMBottomNav />
    </CRMRoleProvider>
  );
}