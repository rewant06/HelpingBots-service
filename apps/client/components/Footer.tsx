"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/crm")) {
return null;
  }

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "You've successfully joined our newsletter.",
      });
      setEmail("");
    }
  };

  return (
    <footer className="relative bg-gradient-to-b from-muted/20 to-muted/40 border-t border-border overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
        {/* Newsletter Section */}
        {/* <div className="max-w-4xl mx-auto mb-12 md:mb-16">
          <div className="glass-effect rounded-2xl p-6 md:p-8 lg:p-10 border-2 border-primary/20 shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
                <Send className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gradient">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6 text-base md:text-lg">
              Subscribe to our newsletter for the latest updates, tips, and exclusive offers
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 glass-effect border-primary/30 focus:border-primary"
                required
              />
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity whitespace-nowrap group"
              >
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="relative h-10 w-10 md:h-12 md:w-12 transition-transform group-hover:scale-110">
              <Image
                src="/android-chrome-192x192.png"
                alt="HelpingBots Logo"
                fill
                sizes="(max-width: 768px) 40px, 48px"
                className="object-contain"
              />
              </div>
              <span className="text-xl md:text-2xl font-bold text-gradient">
                HelpingBots
              </span>
            </Link>
            <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
              Transforming visions into reality with completely affordable, professional development and design services. Your success is our mission.
            </p>
            <div className="flex gap-3">
              {[
                
                { icon: Linkedin, href: "https://www.linkedin.com/in/rewant-raj", label: "LinkedIn" },
                { icon: Instagram, href: "https://instagram.com/rewant06", label: "Instagram" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg glass-effect border border-border hover:border-primary hover:bg-primary/10 transition-all hover:scale-110 group"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "Services", path: "/services" },
                { name: "About Us", path: "/about" },
                { name: "Get Started", path: "/get-started" },
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    href={link.path} 
                    className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-lg">Our Services</h3>
            <ul className="space-y-3">
              {[
                "Software Development",
                "Graphics Designing",
                "Web Applications",
                "Mobile Apps",
                "UI/UX Design",
                "Cloud Solutions",
              ].map((service) => (
                <li key={service}>
                  <span className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer inline-block hover:translate-x-1">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-lg">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                </div>
                <a href="rewant.off@gmail.com" className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors">
                  rewant.off@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                </div>
                <a href="tel:+917909053014" className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors">
                  +91 7909053014
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                </div>
                <span className="text-sm md:text-base text-muted-foreground">
                  Koramangala, Bangalore, 560034
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm md:text-base text-muted-foreground text-center md:text-left">
              © {currentYear} <span className="text-primary font-semibold">HelpingBots</span>. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;