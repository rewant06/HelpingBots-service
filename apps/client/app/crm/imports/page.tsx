import type { Metadata } from 'next';
import { ImportsView } from '@/components/crm/imports/ImportsView';

export const metadata: Metadata = {
  title: 'Import Center',
  description: 'Upload and manage lead data imports.',
};

export default function ImportsPage() {
  return <ImportsView />;
}