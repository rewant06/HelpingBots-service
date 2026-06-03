import type { Metadata } from 'next';
import { CRMRoleProvider } from '@/lib/crm/role-context';
import { CRMTopBar } from '@/components/crm/shell/CRMTopBar';
import { CRMSidebar } from '@/components/crm/shell/CRMSidebar';
import { CRMBottomNav } from '@/components/crm/shell/CRMBottomNav';

export const metadata: Metadata = {
  title: {
    default: 'CRM',
    template: '%s | HelpingBots CRM',
  },
  description: 'HelpingBots CRM — Role-based EdTech admissions management.',
};

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CRMRoleProvider>
      {/*
       * Outer wrapper: full-width column.
       * min-h-screen ensures the sidebar fills the viewport even on short pages.
       */}
      <div className="flex min-h-screen w-full flex-col">
        {/* Topbar spans the full CRM width */}
        <CRMTopBar />

        {/* Content row: sidebar (desktop) + scrollable main */}
        <div className="flex flex-1">
          <CRMSidebar />
          <main
            id="crm-main-content"
            className="flex-1 min-w-0 p-4 sm:p-6 pb-24 lg:pb-6"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav — fixed, outside the content flow */}
      <CRMBottomNav />
    </CRMRoleProvider>
  );
}