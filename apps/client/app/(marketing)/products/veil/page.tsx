import { VeilHero } from "@/components/veil/VeilHero";
import { VeilFeatures } from "@/components/veil/VeilFeatures";
import { VeilPricing } from "@/components/veil/VeilPricing";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veil API - Anonymous Feedback Infrastructure",
  description: "Secure, multi-tenant anonymous feedback API for enterprises.",
};

export default function VeilProductPage() {
  return (
    <main className="min-h-screen bg-background">
      <VeilHero />
      <VeilFeatures />
      <VeilPricing />
    </main>
  );
}