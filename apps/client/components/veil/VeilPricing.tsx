import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function VeilPricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          
          {/* Left: Pitch */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Start your <span className="text-gradient">Free Pilot</span></h2>
            <p className="text-xl text-muted-foreground mb-8">
              Experience the power of honest feedback. Our Free Tier is generous enough for most startups and schools.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Up to 200 Active Users (Free)",
                "Unlimited Posts & Polls",
                "Basic Moderation Filters",
                "30-Day Data Retention",
                "Email Support"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-3xl opacity-20" />
            <div className="relative p-8 rounded-3xl glass-effect border-2 border-primary/20 text-center">
              <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Developer Preview</div>
              <div className="text-5xl font-bold mb-2">$0</div>
              <div className="text-muted-foreground mb-8">per month</div>
              
              <Button asChild size="lg" className="w-full text-lg h-14 bg-primary hover:opacity-90">
                <Link href="/login?redirect=/dashboard/developer">
                  Generate API Key
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">No credit card required.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}