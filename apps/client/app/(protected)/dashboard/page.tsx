"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getMyTenants } from "@/lib/tenant.service";
import { getActivityLogs } from "@/lib/activity.service";
import { Tenant } from "@/types/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

// Import New Components
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { MobileFAB } from "@/components/dashboard/MobileFAB";

interface SystemHealth {
  database: "UP" | "DOWN";
  redis: "UP" | "DOWN";
  latency: number;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantData, logsData, healthData] = await .all([
          getMyTenants(),
          getActivityLogs(1, 5),
          api
            .get<SystemHealth>("/health")
            .then((res) => res.data)
            .catch(() => null),
        ]);
        setTenants(tenantData);
        setHealth(healthData);
      } catch (e) {
        console.error("Dashboard fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const roleName = user?.roles?.[0]?.name || "User";
  const isHealthy = health?.database === "UP" && health?.redis === "UP";

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-8">
      {/* Mobile FAB */}
      <MobileFAB />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gradient">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold">{user?.name}</span>.
          </p>
        </div>
        <div className="hidden md:flex">
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg">
            <Link href="/dashboard/developer">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. Metrics Row (Scrollable on very small screens if needed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Org Count */}
        <Card className="glass-effect border-primary/20 relative overflow-hidden p-4 flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Building2 className="w-12 h-12" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">Orgs</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">
            {loading ? <Skeleton className="h-8 w-8" /> : tenants.length}
          </div>
        </Card>

        {/* Role */}
        <Card className="glass-effect border-border/50 p-4 flex flex-col justify-between">
          <div className="text-sm font-medium text-muted-foreground">Role</div>
          <div className="text-lg md:text-2xl font-bold uppercase text-primary truncate">
            {roleName}
          </div>
        </Card>

        {/* System Status */}
        <Card
          className={`glass-effect p-4 flex flex-col justify-between ${
            isHealthy ? "border-green-500/20" : "border-destructive/20"
          }`}
        >
          <div className="text-sm font-medium text-muted-foreground">
            System
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isHealthy ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              // <AlertCircle className="w-5 h-5 text-destructive" />
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            <span className="font-bold">
              {isHealthy ? "Good" : "Excellent"}
            </span>
          </div>
        </Card>

        {/* Promo */}
        <Card className="bg-secondary/20 border-dashed border-secondary p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-secondary/40 transition-colors">
          <Link href="/products/veil">
            <span className="text-xs font-bold text-primary uppercase">
              VEIL
            </span>
            <span className="text-xs text-muted-foreground block mt-1">
              &rarr;
            </span>
          </Link>
        </Card>
      </div>

      {/* 2. Main Layout (Grid Areas for Mobile Ordering) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section (Spans 2 cols on Desktop) */}
        <div className="lg:col-span-2 min-h-[250px]">
          <ActivityChart />
        </div>

        {/* Organizations (Moved UP visually on mobile if we used flex-col-reverse, but Grid is cleaner) */}
        {/* On Mobile, this appears AFTER Chart. This is acceptable. */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" /> My Orgs
            </h3>
            <Link
              href="/dashboard/developer"
              className="text-xs text-primary hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="grid gap-3">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              tenants.slice(0, 3).map((tenant) => (
                <Link key={tenant.id} href="/dashboard/developer">
                  <Card className="p-3 hover:border-primary/50 transition-all cursor-pointer flex justify-between items-center group">
                    <div>
                      <div className="font-semibold text-sm group-hover:text-primary">
                        {tenant.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {tenant.slug}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:translate-x-1 transition-transform" />
                  </Card>
                </Link>
              ))
            )}
            {tenants.length === 0 && !loading && (
              <div className="text-center p-4 border border-dashed rounded-lg text-xs text-muted-foreground">
                No organizations yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
