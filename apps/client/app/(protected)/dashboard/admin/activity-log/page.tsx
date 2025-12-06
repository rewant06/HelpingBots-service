"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { getActivityLogs } from "@/lib/activity.service";
import { PaginatedResponse, ActivityLog } from "@/types/index";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const logsFetcher = ([_, page]: [string, number]) => getActivityLogs(page);

export default function AdminActivityLogPage() {
  const [page, setPage] = useState(1);
  // const [statusFilter, setStatusFilter] = useState<string | null>(null); // V2: Add filter logic to fetcher
  const swrKey: [string, number] = ["/api/admin/activity-log", page];

  const {
    data: paginatedResponse,
    error,
    isLoading,
  } = useSWR<PaginatedResponse<ActivityLog>>(swrKey, logsFetcher);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 border border-destructive/20">
        <AlertCircle className="h-5 w-5" />
        <span>Failed to load logs. Check your permissions.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Security events and system activities.
          </p>
        </div>
      </div>

      <Card className="glass-effect border-border/50">
        <CardHeader className="hidden md:block">
          <CardTitle>System Activity</CardTitle>
          <CardDescription>Chronological event stream.</CardDescription>
        </CardHeader>

        <CardContent className="p-0 md:p-6">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* --- DESKTOP VIEW (Table) --- */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResponse?.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {log.actorSnapshot?.email || "System"}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                              {log.actorSnapshot?.roles
                                .map((r) => r.name)
                                .join(", ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm max-w-[150px]">
                            <span className="font-medium truncate">
                              {log.entityType}
                            </span>
                            <span className="text-xs text-muted-foreground truncate font-mono">
                              {log.entityId || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={log.status}
                            reason={log.failureReason}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm max-w-[150px]">
                            <span className="font-medium truncate">
                              <JSONPopover data={log.changes} label="Changes" />
                            </span>
                            <span className="text-xs text-muted-foreground truncate font-mono">
                             <JSONPopover data={log.context} label="Context" />
                            </span>
                          </div>
                          
                        </TableCell>

                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* --- MOBILE VIEW (Cards) --- */}
              <div className="md:hidden divide-y divide-border">
                {paginatedResponse?.data.map((log) => (
                  <MobileLogCard key={log.id} log={log} />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Page {paginatedResponse?.meta.page} of{" "}
              {paginatedResponse?.meta.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={paginatedResponse?.meta.lastPage || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- SUBCOMPONENTS for Cleanliness ---

function StatusBadge({
  status,
  reason,
}: {
  status: string;
  reason?: string | null;
}) {
  const isSuccess = status === "SUCCESS";
  return (
    <div>
      <Badge
        className={cn(
          "border-0",
          isSuccess
            ? "bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25"
            : "bg-destructive/15 text-destructive hover:bg-destructive/25"
        )}
      >
        {status}
      </Badge>
      {!isSuccess && reason && (
        <p
          className="text-[10px] text-destructive mt-1 max-w-[120px] leading-tight truncate"
          title={reason}
        >
          {reason}
        </p>
      )}
    </div>
  );
}

function JSONPopover({ data, label }: { data: any; label: string }) {
  if (!data || Object.keys(data).length === 0)
    return <span className="text-muted-foreground text-xs">-</span>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Code className="h-3 w-3 mr-1" /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="bg-muted/50 p-2 border-b text-xs font-semibold">
          {label}
        </div>
        <ScrollArea className="h-[200px] w-full p-2">
          <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function MobileLogCard({ log }: { log: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 space-y-3 bg-card hover:bg-muted/5 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{log.actorSnapshot?.email || "System"}</span>
          <span className="text-xs text-muted-foreground">
            action {log.actionType}
          </span>
        </div>
        <StatusBadge status={log.status} />
      </div>

      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="bg-muted px-1.5 py-0.5 rounded border border-border/50">
            {log.entityType}
          </span>
          <span className="font-mono truncate max-w-[100px]">
            {log.entityId}
          </span>
        </div>
        <span>{format(new Date(log.createdAt), "MM/dd HH:mm")}</span>
      </div>

      {(log.failureReason ||
        (log.changes && Object.keys(log.changes).length > 0)) && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between h-8 text-xs px-0 hover:bg-transparent text-primary"
          >
            {expanded ? "Hide Details" : "Show Details"}
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>

          {expanded && (
            <div className="mt-2 space-y-2 animate-accordion-down">
              {log.failureReason && (
                <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                  <span className="font-bold">Error:</span> {log.failureReason}
                </div>
              )}
              {log.changes && (
                <div className="rounded border border-border bg-muted/30 p-2">
                  <pre className="text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </div>
              )}
              {log.context && (
                <div className="rounded border border-border bg-muted/30 p-2">
                  <pre className="text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
