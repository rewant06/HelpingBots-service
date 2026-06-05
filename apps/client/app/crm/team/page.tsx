import type { Metadata } from 'next';
import { TeamView } from '@/components/crm/team/TeamView';

export const metadata: Metadata = {
  title: 'Team',
  description: 'Manage team members and view team performance.',
};

export default function TeamPage() {
  return <TeamView />;
}