"use client";

import Services from "@/components/Services";
import { Sparkles, Zap } from "lucide-react";

const ServicesPage = () => {
  return (
    <div className="min-h-screen relative">
      {/* Decorative Background Elements */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none -z-10"
        style={{
          background: "var(--gradient-mesh)",
        }}
      />

      {/* Floating orbs for extra visual interest */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float -z-10" />
      <div
        className="absolute top-40 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float -z-10"
        style={{ animationDelay: "1.5s" }}
      />

      <main className="pt-32 pb-20">
        {/* Enhanced Hero Section */}
        <div className="container mx-auto px-4 mb-16 md:mb-24">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                End-to-End Solutions
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              We Build <br />
              <span className="text-gradient">Digital Excellence</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
              From the first line of code to the final pixel, we provide a comprehensive suite of affordable
              services designed to scale with your vision.
            </p>

            {/* Stats Mini-Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-12 max-w-2xl mx-auto mt-12 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">
                  Affordable
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="hidden md:block text-center">
                <div className="text-3xl font-bold text-foreground flex justify-center items-center gap-2">
                  <Zap className="w-6 h-6 text-accent fill-accent" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Fast Delivery
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Grid Component (No Duplicate Title) */}
        <Services showTitle={false} className="py-0" />
      </main>
    </div>
  );
};

export default ServicesPage;
