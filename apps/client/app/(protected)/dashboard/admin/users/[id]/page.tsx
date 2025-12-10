"use client";

import React, { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  getUserById, 
  updateUserRoles,
  manuallyVerifyUser,
  getUserActivity
} from "@/lib/user.service";
import { User, PaginatedResponse, ActivityLog } from "@/types/index";
import { cn } from "@/lib/utils";

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --- ICONS ---
import { 
  ArrowLeft, 
  Shield, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Code,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Activity,
  Clock
} from "lucide-react";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { mutate } = useSWRConfig();
  const [isVerifying, setIsVerifying] = useState(false);

  // --- DATA FETCHING ---
  const { data: user, error, isLoading } = useSWR<User>(
    userId ? `/users/${userId}` : null,
    () => getUserById(userId)
  );

  // --- HANDLERS ---
  
  // 1. Helper to check if user has a specific role
  const hasRole = (roleName: string) => user?.roles.some((r) => r.name === roleName);

  // 2. Role Toggle Logic
  const handleRoleToggle = async (roleName: string, checked: boolean) => {
    if (!user) return;
    
    // Optimistic Update Calculation
    let newRoles = user.roles.map((r) => r.name);
    if (checked) {
      newRoles.push(roleName);
    } else {
      newRoles = newRoles.filter((r) => r !== roleName);
    }

    try {
      // Call Service
      const updated = await updateUserRoles(userId, newRoles);
      // Mutate SWR Cache instantly
      mutate(`/users/${userId}`, updated, false); 
      toast.success(`Role '${roleName}' ${checked ? "assigned" : "removed"}`);
    } catch (err) {
      toast.error("Failed to update roles. Please try again.");
    }
  };

  // 3. Manual Verify Logic
  const handleManualVerify = async () => {
    if (!confirm("Are you sure you want to verify this user manually?")) return;
    setIsVerifying(true);
    try {
      const updated = await manuallyVerifyUser(userId);
      mutate(`/users/${userId}`, updated, false);
      toast.success("User manually verified.");
    } catch (err) {
      toast.error("Failed to verify user.");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- LOADING STATES ---
  if (isLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
    </div>
  );
  
  if (error) return (
    <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
        <XCircle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">User not found</h3>
      <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-10 max-w-7xl mx-auto">
      {/* --- BLOCK 1: RESPONSIVE HEADER --- */}
      <div className="flex flex-col gap-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()} 
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
          </Button>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 rounded-2xl bg-card border border-border/50 shadow-sm relative overflow-hidden">
           {/* Decorative Background Gradient */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent to-primary/50" />

           <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Avatar */}
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg shrink-0">
                <AvatarImage src={undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="space-y-2">
                 <div className="space-y-1">
                   <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                     {user?.name}
                   </h1>
                   <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md">
                        <Mail className="h-3.5 w-3.5" /> {user?.email}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-xs opacity-70">
                        <Code className="h-3.5 w-3.5" /> {user?.id}
                      </span>
                   </div>
                 </div>

                 <div className="flex flex-wrap gap-2 mt-3">
                    {user?.roles.map(role => (
                       <Badge key={role.name} variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10">
                          {role.name}
                       </Badge>
                    ))}
                 </div>
              </div>
           </div>

           {/* Actions Area */}
           <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
               {user?.isEmailVerified ? (
                 <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-0 px-3 py-1 text-sm h-9">
                   <CheckCircle2 className="h-4 w-4 mr-1.5" /> Verified Account
                 </Badge>
               ) : (
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border-0 px-3 py-1 text-sm h-9 flex-1 md:flex-none justify-center">
                      <XCircle className="h-4 w-4 mr-1.5" /> Pending
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 flex-1 md:flex-none"
                      onClick={handleManualVerify}
                      disabled={isVerifying}
                    >
                      {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Check className="h-3.5 w-3.5 mr-1.5"/>}
                      Verify Now
                    </Button>
                 </div>
               )}
           </div>
        </div>
      </div>

      {/* --- BLOCK 2: MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROLS (Sidebar on Desktop) */}
        <div className="space-y-6">
          
          {/* 1. PERMISSIONS CARD */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" /> 
                Access Control
              </CardTitle>
              <CardDescription>Manage system permissions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Admin Switch */}
              <div className="flex items-center justify-between p-4 border-b hover:bg-muted/20 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    Administrator
                    {hasRole("ADMIN") && <Badge variant="outline" className="text-[10px] h-5 border-primary/20 text-primary bg-primary/5">Active</Badge>}
                  </Label>
                  <p className="text-xs text-muted-foreground">Full system configuration access</p>
                </div>
                <Switch
                  checked={hasRole("ADMIN")}
                  onCheckedChange={(c) => handleRoleToggle("ADMIN", c)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* User Switch */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                 <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Standard User</Label>
                  <p className="text-xs text-muted-foreground">Basic platform features</p>
                </div>
                <Switch
                  checked={hasRole("USER")}
                  onCheckedChange={(c) => handleRoleToggle("USER", c)}
                  disabled={true} // Cannot remove basic USER role
                  className="opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. METADATA CARD */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Account Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 opacity-70" /> Joined
                </span>
                <span className="font-medium">{format(new Date(user?.createdAt || new Date()), "PPP")}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-70" /> Last Update
                </span>
                <span className="font-medium">{format(new Date(user?.updatedAt || new Date()), "PPP")}</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* --- BLOCK 3: RIGHT COLUMN (ACTIVITY & LOGS) --- */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="activity" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="sessions" disabled className="opacity-50 cursor-not-allowed">
                  Sessions
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="activity" className="mt-0">
              <Card className="border-border/60 shadow-sm min-h-[500px]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Audit Log
                  </CardTitle>
                  <CardDescription>
                    Track actions performed on or by this user account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* The Intelligent Log Component */}
                  <UserActivityLog userId={userId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function UserActivityLog({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // SWR Fetcher Wrapper
  const { data: response, isLoading } = useSWR<PaginatedResponse<ActivityLog>>(
    ["user-activity", userId, page],
    () => getUserActivity(userId, page, LIMIT),
    { keepPreviousData: true }
  );

  // 1. Loading State
  if (isLoading && !response) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  // 2. Empty State
  if (!response?.data || response.data.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
           <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
             <Activity className="h-6 w-6 opacity-50" />
           </div>
           <p>No activity recorded yet.</p>
        </div>
     );
  }

  // 3. Render Data
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* DESKTOP VIEW: TABLE (Hidden on Mobile) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Action Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {response.data.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/10">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                      {log.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-xs">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[80px]" title={log.entityId}>
                          {log.entityId.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusDot status={log.status} />
                  </TableCell>
                  <TableCell>
                    <PayloadPopover changes={log.changes} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE VIEW: TIMELINE (Visible on Mobile) */}
        <div className="md:hidden px-4 py-2 space-y-6 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-4 bottom-4 w-px bg-border/60" />
          
          {response.data.map((log) => (
            <div key={log.id} className="relative pl-8 flex flex-col gap-1">
              {/* Timeline Dot */}
              <div className={cn(
                "absolute left-[0.35rem] top-1.5 h-2.5 w-2.5 rounded-full border border-background ring-2 ring-background",
                log.status === "SUCCESS" ? "bg-green-500" : "bg-red-500"
              )} />
              
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{log.actionType}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(log.createdAt), "MM/dd HH:mm")}</span>
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{log.entityType}</span>
                {Object.keys(log.changes || {}).length > 0 && (
                   <PayloadPopover changes={log.changes} mobile />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAGINATION (Shared) */}
      <div className="flex items-center justify-between p-4 border-t mt-auto bg-muted/5">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{response.meta.page}</span> of {response.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
               variant="outline"
               size="icon"
               className="h-8 w-8"
               onClick={() => setPage(p => p + 1)}
               disabled={response.meta.lastPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatusDot({ status }: { status: string }) {
  const isSuccess = status === "SUCCESS";
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border",
      isSuccess 
        ? "bg-green-500/10 text-green-700 border-green-500/20" 
        : "bg-red-500/10 text-red-700 border-red-500/20"
    )}>
      <div className={cn("h-1.5 w-1.5 rounded-full", isSuccess ? "bg-green-500" : "bg-red-500")} />
      {status}
    </div>
  );
}

function PayloadPopover({ changes, mobile }: { changes: any, mobile?: boolean }) {
  if (!changes || Object.keys(changes).length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-6 w-auto px-2 gap-1 text-xs hover:bg-primary/5 hover:text-primary", mobile && "h-5 px-0 hover:bg-transparent p-0 text-primary")}>
           <Code className="h-3 w-3" />
           {mobile ? "View Payload" : "View"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="start">
        <div className="bg-muted/30 px-3 py-2 border-b flex justify-between items-center">
          <span className="text-xs font-semibold">Change Payload</span>
          <span className="text-[10px] text-muted-foreground">JSON</span>
        </div>
        <ScrollArea className="h-[200px] w-full p-3 bg-zinc-950 text-zinc-50">
           <pre className="text-[10px] font-mono leading-relaxed">
             {JSON.stringify(changes, null, 2)}
           </pre>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}