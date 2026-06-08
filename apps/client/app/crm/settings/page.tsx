import type { Metadata } from 'next';
import { SettingsView } from '@/components/crm/settings/SettingsView';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure CRM settings, pipeline stages, team members, and notifications.',
};

export default function SettingsPage() {
  return <SettingsView />;
}