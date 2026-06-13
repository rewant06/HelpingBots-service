"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Palette,
  ChevronRight,
  Smartphone,
  Database,
  Globe,
  Video,
  Brain,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ServicesProps {
  showTitle?: boolean;
  className?: string;
}

const servicesData = [
  {
    id: "software",
    title: "Products",
    icon: Code,
    description: "Services with cutting-edge technologies",
    color: "from-primary to-primary-glow",
    projects: [
      {
        name: "Veil ",
        description:
          "The Truth Protocol, anonymous feedback and posting (BaaS & SaaS)",
        icon: Shield,
        link: "/products/veil",
      },
      {
        name: "CRM for EdTech",
        description: "",
        icon: Database,
        link: "/products/crm",
      },
      {
        name: "School Management",
        description: "Under Development, Coming soon",
        icon: Database,
      },
      {
        name: "AI-Physician",
        description: "Under Progress, Comming soon",
        icon: Brain,
      },
      // { name: "AI Integration", description: "Smart features powered by machine learning", icon: Brain },
      // { name: "Security Systems", description: "Identity management & data protection", icon: Lock },
    ],
  },
  {
    id: "graphics",
    title: "Developments",
    icon: Palette,
    description:
      "Quality design and development services that captivate your audience",
    color: "from-accent to-secondary",
    projects: [
      {
        name: "Brand Identity",
        description: "Logos, color schemes, and brand guidelines",
        icon: Palette,
      },
      {
        name: "UI/UX Design",
        description: "User-centered interface design for all platforms",
        icon: Smartphone,
      },
      {
        name: "Web Applications",
        description: "Responsive, modern web apps with Nextjs and RestApi's",
        icon: Globe,
      },
      {
        name: "Video Editing",
        description: "Professional video production & post-processing",
        icon: Video,
      },
      // { name: "3D Graphics", description: "Stunning 3D models and visualizations", icon: Globe },
      // { name: "Product Design", description: "E-commerce visuals & product mockups", icon: ShoppingCart },
    ],
  },
];

const Services = ({ showTitle = true, className }: ServicesProps) => {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <section
      ref={sectionRef}
      className={cn("py-16 relative overflow-hidden", className)}
    >
      <div className="container mx-auto px-4 relative z-10">
        {/* Conditional Title Rendering */}
        {showTitle && (
          <div
            className={cn(
              "text-center mb-12 md:mb-16 transition-all duration-700",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            )}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Our <span className="text-gradient">Services</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
              Comprehensive solutions tailored to transform your ideas into
              exceptional digital experiences
            </p>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-6">
          {servicesData.map((service, index) => (
            <Card
              key={service.id}
              className={cn(
                "overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-500 cursor-pointer group hover-lift",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              )}
              style={{ transitionDelay: `${index * 200}ms` }}
              onClick={() => toggleService(service.id)}
            >
              <CardContent className="p-0">
                <div className="p-6 md:p-8 flex items-center gap-4 md:gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div
                    className={`relative p-4 md:p-5 rounded-2xl bg-gradient-to-br ${service.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  >
                    <service.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>

                  <div className="flex-1 relative">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 md:mb-2 group-hover:text-gradient transition-all">
                      {service.title}
                    </h3>
                    <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                      {service.description}
                    </p>
                  </div>

                  <ChevronRight
                    className={cn(
                      "relative h-6 w-6 md:h-8 md:w-8 text-primary transition-all duration-300",
                      expandedService === service.id
                        ? "rotate-90 scale-110"
                        : "group-hover:translate-x-1"
                    )}
                  />
                </div>

                {expandedService === service.id && (
                  <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4 animate-fade-in">
                    <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {service.projects.map((project, pIndex) =>
                        project.link ? (
                          <Link
                            key={pIndex}
                            href={project.link}
                            className="p-4 md:p-5 rounded-xl glass-effect border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group/project hover-lift block cursor-pointer"
                          >
                            <div className="p-3 w-fit rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mb-3 group-hover/project:scale-110 transition-transform">
                              <project.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h4 className="font-bold text-base md:text-lg text-foreground mb-2 group-hover/project:text-gradient transition-all flex items-center gap-2">
                              {project.name}
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {project.description}
                            </p>
                          </Link>
                        ) : (
                          <div
                            key={pIndex}
                            className="p-4 md:p-5 rounded-xl glass-effect border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group/project hover-lift"
                          >
                            <div className="p-3 w-fit rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mb-3 group-hover/project:scale-110 transition-transform">
                              <project.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h4 className="font-bold text-base md:text-lg text-foreground mb-2 group-hover/project:text-gradient transition-all">
                              {project.name}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {project.description}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
