"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Eye } from "lucide-react";
import { useEffect, useState } from "react";

export function VeilHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-background pt-32 md:pt-0">
      {/* Cyberpunk Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px),
                           linear-gradient(to bottom, #808080 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />

      <div className="container relative z-10 px-4 text-center">
        
        {/* Animated Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Shield className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">The Truth Protocol is Live</span>
        </div>

        {/* Headline */}
        <h1 className={`text-4xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Give them a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer">Mask</span>,<br />
          and they will tell you the <span className="text-foreground">Truth</span>.
        </h1>

        {/* Subheadline */}
        <p className={`text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Veil is the enterprise-grade API for anonymous feedback, whistleblowing, and secure internal communities. 
          <span className="block mt-2 text-foreground font-medium">Deploy a safe space in 5 minutes.</span>
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full shadow-elevated hover:scale-105 transition-transform">
            <Link href="/veil">
              VEIL Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full backdrop-blur-sm border-primary/20 hover:bg-primary/5">
            <Link href="#pricing">
              Get API Key
              <Lock className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}