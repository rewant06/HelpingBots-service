"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import Link from "next/link";
import { getAllUsers } from "@/lib/user.service";
import { User, PaginatedResponse } from "@/types/index";
import { cn } from "@/lib/utils";

// --- UI IMPORTS ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- ICONS ---
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Mail,
  AlertCircle,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// --- FETCHER ---
const usersFetcher = ([_, page]: [string, number]) => getAllUsers(page);

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Data Fetching
  const {
    data: paginatedResponse,
    error,
    isLoading,
  } = useSWR<PaginatedResponse<User>>(["/users", page], usersFetcher, {
    keepPreviousData: true,
    shouldRetryOnError: false,
  });

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="p-6 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center gap-3 border border-destructive/20 animate-fade-in">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Failed to load users. System unreachable.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      {/* 1. HEADER SECTION (Mobile Optimized) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-sm text-muted-foreground">
              {paginatedResponse?.meta.total || 0} total users
            </p>
          </div>
          {/* Mobile "Add" Button (Icon Only) */}
          <Button size="icon" className="md:hidden shrink-0 shadow-sm">
            <Plus className="h-5 w-5" />
          </Button>
          {/* Desktop "Add" Button (Full) */}
          <Button className="hidden md:flex gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-muted/40 border-border/60 focus:bg-background transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {isLoading && !paginatedResponse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 3. RESPONSIVE DATA DISPLAY SWITCH */}
          
          {/* A. MOBILE VIEW (Visible < md) - Cards */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginatedResponse?.data.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {/* B. DESKTOP VIEW (Visible >= md) - Table */}
          <div className="hidden md:block rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">User Profile</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResponse?.data.map((user) => (
                  <UserTableRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* 4. PAGINATION */}
          <div className="flex items-center justify-between py-4">
             <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="w-24"
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{paginatedResponse?.meta.page}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={paginatedResponse?.meta.lastPage || isLoading}
                className="w-24"
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>
        </>
      )}
    </div>
  );
}

// --- HELPER COMPONENTS ---

// 1. Mobile Card
function UserCard({ user }: { user: User }) {
  return (
    <Card className="relative overflow-hidden border-border/60 hover:shadow-md transition-all group active:scale-[0.98] duration-200">
      {/* Clickable Area Overlay */}
      <Link href={`/dashboard/admin/users/${user.id}`} className="absolute inset-0 z-10" />
      
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border bg-background">
            <AvatarImage src={undefined} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <h3 className="font-semibold text-sm truncate pr-2">{user.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <StatusBadge isVerified={user.isEmailVerified || false} />
      </CardHeader>
      
      <CardContent className="pb-3 pt-0">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {user.roles.map((role) => (
            <Badge
              key={role.name}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50 border border-border/20"
            >
              <Shield className="h-2.5 w-2.5 mr-1 opacity-70" />
              {role.name}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 border-t pt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(user.createdAt), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1 text-primary/80 font-medium group-hover:translate-x-1 transition-transform">
            Details <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// 2. Desktop Table Row
function UserTableRow({ user }: { user: User }) {
  return (
    <TableRow className="group cursor-pointer hover:bg-muted/40 transition-colors">
      <TableCell className="relative">
        {/* Full Row Clickable */}
        <Link href={`/dashboard/admin/users/${user.id}`} className="absolute inset-0 z-10" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50 transition-transform group-hover:scale-105 bg-background">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {user.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground/90 group-hover:text-primary transition-colors">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.name} variant="outline" className="text-xs font-normal border-border/60 bg-transparent">
              {role.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge isVerified={user.isEmailVerified || false} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(user.createdAt), "MMM d, yyyy")}
      </TableCell>
      <TableCell className="text-right relative z-20">
        {/* Z-Index 20 to sit above the row link */}
        <UserActionsDropdown userId={user.id} />
      </TableCell>
    </TableRow>
  );
}

// 3. Status Badge (Shared)
function StatusBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 px-1.5 gap-1 text-[10px] font-medium border-0",
        isVerified
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      {isVerified ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isVerified ? "Verified" : "Pending"}
    </Badge>
  );
}

// 4. Actions Dropdown (Shared Logic)
function UserActionsDropdown({ userId }: { userId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">Manage Access</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(userId)}>
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem>View Profile</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          Deactivate User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}