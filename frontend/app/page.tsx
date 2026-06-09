import { ContactSection } from "@/components/contact-section";
import { FAQAccordion } from "@/components/faq-accordion";
import { FeatureSection } from "@/components/feature-section";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { PricingSection } from "@/components/pricing-section";
import { ScrollRevealConcept } from "@/components/scroll-reveal-concept";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import GlobeFeatureSection from "@/components/ui/globe-feature-section";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Header />

      <main className="flex-1 pb-20">
        <HeroSection />
        <LogosSection />
        <ScrollRevealConcept />

        <section
          id="features"
          className="relative mx-auto w-full max-w-5xl px-4 py-24"
        >
          <div className="pointer-events-none absolute top-1/3 -left-12 -z-10 h-72 w-72 rounded-full bg-purple-500/10 blur-[90px]" />
          <div className="pointer-events-none absolute right-12 bottom-10 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />

          <div className="mb-16 space-y-4 text-center">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3 animate-pulse text-purple-500" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
              Autonomous Student Success
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
              Sutra AI acts as the proactive bridge between school classrooms
              and deeply personalized tutoring.
            </p>
          </div>

          <FeatureSection />
        </section>

        <TestimonialsCarousel />
        <PricingSection />

        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <GlobeFeatureSection />
        </div>

        <FAQAccordion />
        <ContactSection />
      </main>

      <footer className="border-t border-border/40 bg-card/10 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 Sutra AI. Powered by Autonomous Academic Systems.</p>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
