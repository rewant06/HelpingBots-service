"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Key, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded Menu */}
      <div className={cn(
          "flex flex-col gap-2 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )}>
         <Button asChild size="sm" className="shadow-lg gap-2 bg-background border border-border text-foreground hover:bg-muted">
            <Link href="/dashboard/developer">
               <Key className="w-4 h-4 text-accent"/> New API Key
            </Link>
         </Button>
         <Button asChild size="sm" className="shadow-lg gap-2 bg-background border border-border text-foreground hover:bg-muted">
            <Link href="/dashboard/developer">
               <Building2 className="w-4 h-4 text-primary"/> New Org
            </Link>
         </Button>
      </div>

      {/* Trigger Button */}
      <Button 
        size="icon" 
        className={cn(
            "h-12 w-12 rounded-full shadow-xl transition-transform duration-300",
            isOpen ? "bg-destructive hover:bg-destructive/90 rotate-45" : "bg-primary hover:bg-primary/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}