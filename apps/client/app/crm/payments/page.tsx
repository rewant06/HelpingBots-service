import type { Metadata } from 'next';
import { PaymentsView } from '@/components/crm/payments/PaymentsView';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Manage student payments and track transactions.',
};

export default function PaymentsPage() {
  return <PaymentsView />;
}