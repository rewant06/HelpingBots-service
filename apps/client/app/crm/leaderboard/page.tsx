import type { Metadata } from 'next';
import { LeaderboardView } from '@/components/crm/leaderboard/LeaderboardView';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Team performance rankings and achievements.',
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}