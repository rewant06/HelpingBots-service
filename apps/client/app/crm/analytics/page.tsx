import type { Metadata } from 'next';
import { AnalyticsView } from '@/components/crm/analytics/AnalyticsView';

export const metadata: Metadata = {
  title: 'Analytics',
  description:
    'Lead pipeline analytics, conversion metrics, and revenue tracking for HelpingBots EdTech CRM.',
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}