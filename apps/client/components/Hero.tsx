"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Rocket } from "lucide-react";

// Type definition for stable particle rendering
interface Particle {
  id: number;
  left: string;
  top: string;
  delay: string;
  duration: string;
}

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Generate particles only on client-side to match hydration
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setParticles(newParticles);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient mesh background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "var(--gradient-mesh)",
          animation: "float 20s ease-in-out infinite",
        }}
      />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/3 -right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Floating particles (Client Only) */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className={`flex justify-center mb-8 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-effect border-primary/30 shadow-lg">
              <Sparkles className="h-4 w-4 text-primary animate-glow" />
              <span className="text-sm font-semibold text-gradient">
                100% Satisfaction
              </span>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          {/* Main Heading */}
          <h1
            className={`text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center mb-6 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <span className="block mb-2 text-gradient">Your Vision,</span>
            <span className="block bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
              Our Goal
            </span>
          </h1>

          {/* Subheading */}
          <p
            className={`text-lg md:text-xl lg:text-2xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            Transform your boldest ideas into stunning reality with our
            comprehensive suite of{" "}
            <span className="text-primary font-semibold">
              {" "}
              completely affordable
            </span>{" "}
            development and design services.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-700 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary via-accent to-primary text-white hover:opacity-90 transition-all text-base md:text-lg px-8 py-6 rounded-full shadow-lg shadow-elevated hover:scale-105 group bg-[length:200%_auto] animate-shimmer"
            >
              <Link href="/products/veil">
                 VEIL
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="glass-effect hover:bg-primary/10 text-base md:text-lg px-8 py-6 rounded-full border-2 hover:border-primary/50 transition-all group"
            >
              <Link href="/services">
                Explore Services
                <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 transition-all duration-700 delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {[
              {
                icon: Shield,
                title: "Affordable",
                desc: "Zero hidden costs",
                color: "from-primary to-primary-glow",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Rapid development & delivery",
                color: "from-accent to-secondary",
              },
              {
                icon: Rocket,
                title: "Production Ready",
                desc: "Enterprise-grade quality",
                color: "from-secondary to-accent",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 md:p-8 rounded-2xl glass-effect hover:bg-card/50 transition-all duration-300 hover:-translate-y-2 border-2 border-border/50 hover:border-primary/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg md:text-xl mb-2 text-foreground group-hover:text-gradient transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;