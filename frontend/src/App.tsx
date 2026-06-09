/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { AuthPage } from "@/components/auth-page";
import { FeatureSection } from "@/components/feature-section";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { PricingSection } from "@/components/pricing-section";
import { FAQAccordion } from "@/components/faq-accordion";
import { ContactSection } from "@/components/contact-section";
import GlobeFeatureSection from "@/components/ui/globe-feature-section";
import { ScrollRevealConcept } from "@/components/scroll-reveal-concept";
import { Sparkles } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"home" | "auth">("home");

  if (view === "auth") {
    return <AuthPage onBack={() => setView("home")} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Header */}
      <Header onAuthClick={() => setView("auth")} />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        <HeroSection onGetStarted={() => setView("auth")} />
        <LogosSection />
        
        {/* Conceptual Scroll Reveal Philosophy Statement */}
        <ScrollRevealConcept />
        
        {/* Features / Core Capabilities Section */}
        <section id="features" className="relative mx-auto w-full max-w-5xl px-4 py-24">
          <div className="absolute top-1/3 -left-12 -z-10 h-72 w-72 rounded-full bg-purple-500/10 blur-[90px] pointer-events-none" />
          <div className="absolute bottom-10 -right-12 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />
          
          <div className="mb-16 space-y-4 text-center">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
              Autonomous Student Success
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
              Sutra AI acts as the proactive bridge between school classrooms and deeply personalized tutoring.
            </p>
          </div>

          <FeatureSection />
        </section>

        <TestimonialsCarousel />
        <PricingSection />
        
        {/* Immersive interactive globe banner */}
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <GlobeFeatureSection onJoinToday={() => setView("auth")} />
        </div>

        <FAQAccordion />
        <ContactSection />
      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-border/40 py-8 bg-card/10">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Sutra AI. Powered by Autonomous Academic Systems.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
