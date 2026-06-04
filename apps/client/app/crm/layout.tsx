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
       * pt-16 md:pt-20 clears the fixed marketing navbar (h-16 mobile / h-20 desktop).
       * Without this, the CRM topbar renders behind the fixed navbar — invisible.
       */}
      <div className="flex min-h-screen w-full flex-col pt-16 md:pt-20">
        <CRMTopBar />
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
      <CRMBottomNav />
    </CRMRoleProvider>
  );
}