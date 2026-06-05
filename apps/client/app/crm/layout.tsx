import type { Metadata } from 'next';
import { CRMRoleProvider } from '@/lib/crm/role-context';
import { CRMTopBar } from '@/components/crm/shell/CRMTopBar';
import { CRMSidebar } from '@/components/crm/shell/CRMSidebar';
import { CRMBottomNav } from '@/components/crm/shell/CRMBottomNav';

export const metadata: Metadata = {
  title: {
    default: 'HelpingBots CRM Demo',
    template: '%s | HelpingBots CRM',
  },
  description:
    'Interactive EdTech CRM demo with role-based access control — 6 roles, 25 leads, full admissions pipeline. Built by HelpingBots.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'HelpingBots CRM Demo',
    description:
      'Explore a production-grade EdTech CRM with 6 RBAC roles, lead management, task tracking, payments, and a student portal.',
    type: 'website',
  },
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMRoleProvider>
      {/* No pt-* needed — marketing navbar is hidden for /crm routes */}
      <div className="flex min-h-screen w-full flex-col">
        <CRMTopBar />
        <div className="flex flex-1 overflow-hidden">
          <CRMSidebar />
          <main
            id="crm-main-content"
            className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6"
          >
            {children}
          </main>
        </div>
      </div>
      <CRMBottomNav />
    </CRMRoleProvider>
  );
}