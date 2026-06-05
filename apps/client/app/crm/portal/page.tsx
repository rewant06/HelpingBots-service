import type { Metadata } from 'next';
import { StudentPortalView } from '@/components/crm/portal/StudentPortalView';

export const metadata: Metadata = {
  title: 'Student Portal',
  description: 'View your application status, payments, and progress.',
};

export default function PortalPage() {
  return <StudentPortalView />;
}