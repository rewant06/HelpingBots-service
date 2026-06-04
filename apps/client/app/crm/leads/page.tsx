import type { Metadata } from 'next';
import { LeadsView } from '@/components/crm/leads/LeadsView';

export const metadata: Metadata = {
  title: 'Leads',
  description: 'Manage leads and track admissions pipeline.',
};

export default function LeadsPage() {
  return <LeadsView />;
}