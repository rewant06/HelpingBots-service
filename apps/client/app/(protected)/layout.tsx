"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Activity,
  LogOut,
  Menu,
  ShieldCheck,
  Settings,
  Loader2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth.store";
import { useAuthorization } from "@/hooks/use-authorization";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- SHARED LINK CONFIG ---
const getLinks = (canAccessAdmin: boolean) => [
  { href: "/", label: "Exit", icon: Home },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/developer", label: "Console", icon: Terminal },
  ...(canAccessAdmin
    ? [
        { href: "/dashboard/admin/users", label: "Users", icon: Users },
        {
          href: "/dashboard/admin/activity-log",
          label: "Audit Logs",
          icon: Activity,
        },
      ]
    : []),
  { href: "/dashboard/profile", label: "Settings", icon: Settings },
];

// --- 1. DESKTOP SIDEBAR COMPONENT ---
function DesktopSidebar({
  isCollapsed,
  toggleCollapse,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const { permissions } = useAuthorization();
  const canAccessAdmin = permissions?.includes("MANAGE:all");
  const links = getLinks(canAccessAdmin);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border/50 bg-card/30 min-h-screen fixed left-0 top-0 bottom-0 z-40 glass-effect transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-border/50 h-16 transition-all",
          isCollapsed ? "justify-center" : "px-6 gap-2"
        )}
      >
        <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
        {!isCollapsed && (
          <span className="font-bold text-xl animate-fade-in whitespace-nowrap">
            HelpingBots
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        <TooltipProvider delayDuration={0}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md transition-colors h-10",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed ? "justify-center px-0" : "px-3 gap-3"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium animate-fade-in">
                        {link.label}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{link.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Footer / Toggle */}
      <div className="p-2 border-t border-border/50 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />{" "}
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </Button>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className={cn(
                  "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                  isCollapsed
                    ? "justify-center px-0"
                    : "justify-start px-3 gap-3"
                )}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Logout</span>
                )}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}

// --- 2. MOBILE BOTTOM NAVIGATION ---
function MobileBottomNav() {
  const pathname = usePathname();
  const { permissions } = useAuthorization();
  const canAccessAdmin = permissions?.includes("MANAGE:all");
  const logout = useAuthStore((state) => state.logout);

  // We pick top 4 items for bottom bar, rest go to "More" menu
  const allLinks = getLinks(canAccessAdmin);
  const primaryLinks = allLinks.slice(0, 4);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border z-50 flex justify-around items-center px-2 pb-safe">
      {primaryLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-all",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn("h-5 w-5 mb-0.5", isActive && "fill-current/20")}
            />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}

      {/* Mobile "More" Menu (Sheet Trigger) */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center justify-center w-16 py-1 text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh]">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">More options</SheetDescription>
          <div className="flex flex-col gap-4 py-4">
            {/* Add extra links or logout here */}
            {allLinks.slice(4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted"
              >
                <link.icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            <div onClick={() => logout()} className="flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive cursor-pointer">
              <LogOut className="h-5 w-5" />

              <span  className="font-medium">
                Logout
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- 3. MAIN LAYOUT COMPONENT ---
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMounted, setIsMounted] = useState(false);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Collapsible State
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (hasHydrated && !isAuthenticated) {
      logger.warn("Unauthenticated access to protected route. Redirecting.");
      router.replace("/login");
    }
  }, [isAuthenticated, hasHydrated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isMounted || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Top Bar (Minimal) */}
      <div className="md:hidden h-14 border-b border-border flex items-center px-4 justify-between bg-background/50 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          HelpingBots
        </div>
        {/* Can add Notifications or Profile Avatar here */}
      </div>

      {/* Responsive Components */}
      <DesktopSidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <MobileBottomNav />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 p-4 md:p-8 pb-24 md:pb-8 transition-all duration-300 ease-in-out", // pb-24 adds space for bottom nav
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}
