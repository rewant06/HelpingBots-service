import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Welcome to HelpingBots CRM. Your role-based overview loads here.
        </p>
      </div>

      {/* Placeholder grid — replaced in the next step */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-muted"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main chart placeholder */}
        <div className="h-72 animate-pulse rounded-xl border border-border bg-muted lg:col-span-2" />
        {/* Side panel placeholder */}
        <div className="h-72 animate-pulse rounded-xl border border-border bg-muted" />
      </div>

    </div>
  );
}