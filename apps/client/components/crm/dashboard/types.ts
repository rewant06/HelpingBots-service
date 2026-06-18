import type { ReactNode } from 'react';
import type {
  DashboardMetric,
  Lead,
  LeaderboardEntry,
  LeadSource,
  Task,
} from '@/lib/crm/types';

export interface MarketingPerfEntry {
  memberId: string;
  memberName: string;
  periodCount: number;
  totalCount: number;
  enrolled: number;
  convRate: number;
}

export interface SourceQualityEntry {
  source: LeadSource;
  count: number;
  enrolled: number;
  convRate: number;
}

export interface AttributionEntry {
  memberId: string;
  memberName: string;
  generatedCount: number;
  enrolledCount: number;
  convRate: number;
  assignedTo: { name: string; count: number }[];
}

/**
 * Return shape of hooks/useTeamLeadDashboardData.ts
 * Consumed by sections/TeamLeadSection.tsx
 */
export interface TeamLeadDashboardData {
  periodLeadsCount: number;
  activeLeadsCount: number;
  teamRevenue: { collected: number; pending: number };
  marketingPerf: MarketingPerfEntry[];
  salesPerf: LeaderboardEntry[];
  lbPeriodLabel: string;
  sourceQuality: SourceQualityEntry[];
  attribution: AttributionEntry[];
  /** Overdue tasks for the team — feeds the shared header badge. */
  overdueCount: number;
}



/**
 * Return shape of hooks/useStandardDashboardData.ts
 * Consumed by sections/StandardSection.tsx
 */
export interface StandardDashboardData {
  metrics: DashboardMetric[];
  /** Pre-rendered <TrendChart /> element, or null if this role doesn't see analytics. */
  trendChart: ReactNode | null;
  leadsListTitle: string;
  leadsListSubtitle: string;
  recentLeads: Lead[];
  urgentTasks: Task[];
  /** Top-3 leaderboard entries for the month, or null if not visible to this role. */
  leaderboardEntries: LeaderboardEntry[] | null;
  /** Overdue tasks for this user — feeds the shared header badge. */
  overdueCount: number;
}