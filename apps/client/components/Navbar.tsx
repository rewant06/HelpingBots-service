"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, Zap } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CRMDemoEntry } from '@/components/crm/CRMDemoEntry';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const node = menuRef.current!;
    const focusable = node.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])"
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [isOpen]);

  useEffect(() => setIsOpen(false), [pathname]);

  const handleLogout = async () => {
    logger.log("User clicking logout");
    try {
      await logout();
      router.push("/");
      setIsOpen(false);
    } catch (err) {
      logger.error("Logout failed", err);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About Us", path: "/about" },
  ];

  const isActive = (path: string) => pathname === path;

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group" tabIndex={0}>
            <div className="relative h-10 w-10 md:h-12 md:w-12 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="HelpingBots Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              HelpingBots
            </span>
          </Link>
          <div className="flex items-center gap-2 mr-2 md:mr-0">
            {/* VETERAN FIX: High-Impact Pulse Button */}
            <Button
              asChild
              size="sm"
              className="relative overflow-hidden bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all group"
            >
              <Link
                href="/crm"
                className="flex items-center gap-2 font-bold"
              >
                <Zap className="w-4 h-4 fill-primary animate-pulse" />
                <span>Demo</span>
                {/* Live Indicator Dot */}
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </Link>
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors duration-300 relative group",
                    isActive(link.path)
                      ? "text-primary"
                      : "text-foreground/80 hover:text-primary"
                  )}
                >
                  {link.name}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300",
                      isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="ghost"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Single CTA as requested */}
                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/25"
                >
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            ref={triggerRef}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div
            ref={menuRef}
            className="md:hidden py-4 animate-fade-in border-t border-border"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-border my-2" />

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-3 text-foreground/80 hover:text-primary"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <div className="px-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="px-4">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-primary to-accent"
                  >
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
