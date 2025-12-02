import { Shield, Zap, Lock, Users, Brain, Fingerprint } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Zero-Knowledge Anonymity",
    desc: "We hold the keys. Even you (the employer) cannot unmask a user without a cryptographic warrant."
  },
  {
    icon: Fingerprint,
    title: "Sticky Identities",
    desc: "Users get deterministic pseudonyms (e.g. 'Quiet Panda'). They build reputation without revealing their name."
  },
  {
    icon: Brain,
    title: "AI Moderation Guardrails",
    desc: "Real-time content analysis blocks toxicity, hate speech, and harassment before it hits the database."
  },
  {
    icon: Users,
    title: "Multi-Tenant Isolation",
    desc: "Your data is physically partitioned. TechCorp's secrets will never leak to StartupX."
  },
  {
    icon: Zap,
    title: "Sub-10ms Latency",
    desc: "Built on Redis Clusters and Composite Cursors. Scales to millions of posts instantly."
  },
  {
    icon: Shield,
    title: "Whistleblower Mode",
    desc: "Private, encrypted channels for sensitive reports directly to HR or Legal."
  }
];

export function VeilFeatures() {
  return (
    <section className="py-24 bg-muted/10 relative">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Engineered for <span className="text-gradient">Trust</span></h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We didn't just build a forum. We built a secure infrastructure for honesty.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl glass-effect border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}