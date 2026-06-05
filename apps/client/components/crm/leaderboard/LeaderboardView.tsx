'use client';

import { useMemo, useState } from 'react';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import { useCRMRole } from '@/lib/crm/role-context';
import { LEADERBOARD } from '@/lib/crm/data';
import type { LeaderboardPeriod } from '@/lib/crm/types';

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },

];

const MEDAL_COLORS: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-slate-300 to-slate-500',
  3: 'from-orange-400 to-orange-600',
};

export function LeaderboardView() {
  const { can } = useCRMRole();
  const [selectedPeriod, setSelectedPeriod] =
    useState<LeaderboardPeriod>('month');

  const filteredEntries = useMemo(() => {
    return LEADERBOARD.filter((entry) => entry.period === selectedPeriod).sort(
      (a, b) => b.enrollments - a.enrollments,
    );
  }, [selectedPeriod]);

  if (!can('leaderboard.view')) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Leaderboard access is restricted to administrators and team leads.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Leaderboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top performers ranked by enrollments
          </p>
        </div>

        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedPeriod(opt.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                selectedPeriod === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background hover:bg-muted'
              }`}
              aria-pressed={selectedPeriod === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEntries.slice(0, 3).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {filteredEntries.slice(0, 3).map((entry, idx) => {
            const rank = idx + 1;
            const medalGradient = MEDAL_COLORS[rank];
            const isGain = entry.delta > 0;
            const isFlat = entry.delta === 0;

            return (
              <div
                key={entry.userId}
                className={`rounded-lg border p-4 sm:p-5 ${
                  rank === 1
                    ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-800 dark:from-yellow-950/50 dark:to-yellow-900/30'
                    : rank === 2
                    ? 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-700 dark:from-slate-950/50 dark:to-slate-900/30'
                    : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-950/50 dark:to-orange-900/30'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${medalGradient} text-xl font-bold text-white shadow-lg`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </div>

                  {!isFlat && (
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        isGain
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {isGain ? (
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {Math.abs(entry.delta)}
                    </div>
                  )}
                </div>

                <p className="truncate text-lg font-bold text-foreground">
                  {entry.name}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enrollments</span>
                    <span className="font-semibold text-foreground">
                      {entry.enrollments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold text-primary">
                      ₹{(entry.revenue / 100_000).toFixed(1)}L
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-card py-16 text-center">
            <Award
              className="h-12 w-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="text-base font-medium text-foreground">
              No leaderboard data
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell sm:px-5">
                    Enrollments
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground lg:table-cell lg:px-5">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground sm:px-5">
                    Trend
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isGain = entry.delta > 0;
                  const isFlat = entry.delta === 0;

                  return (
                    <tr
                      key={entry.userId}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center justify-center">
                          {rank <= 3 ? (
                            <span className="text-xl font-bold">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">
                              #{rank}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 sm:px-5">
                        <p className="truncate font-medium text-foreground">
                          {entry.name}
                        </p>
                      </td>

                      <td className="hidden px-4 py-3 text-sm sm:table-cell sm:px-5">
                        <span className="font-semibold text-foreground">
                          {entry.enrollments}
                        </span>
                      </td>

                      <td className="hidden px-4 py-3 text-sm font-semibold text-primary lg:table-cell lg:px-5">
                        ₹{(entry.revenue / 100_000).toFixed(1)}L
                      </td>

                      <td className="px-4 py-3 sm:px-5">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            isGain
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : isFlat
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {isGain ? (
                            <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          ) : isFlat ? null : (
                            <TrendingDown
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                          )}
                          {entry.delta > 0 ? '+' : ''}
                          {entry.delta}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}