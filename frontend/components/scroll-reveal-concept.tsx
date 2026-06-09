"use client";

import * as React from "react";
import { ScrollRevealText } from "./ui/scroll-reveal-text";
import { Compass, Quote } from "lucide-react";

export function ScrollRevealConcept() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-32 text-center relative overflow-hidden flex flex-col items-center justify-center">
      {/* Structural visual rhythm lines */}
      <div className="absolute left-1/2 top-0 h-12 w-px bg-linear-to-b from-transparent to-border" />
      
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-muted-foreground shadow-xs">
          <Compass className="h-5 w-5 text-purple-500 animate-spin-slow" />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Learning Pedagogy & Design
        </span>
      </div>

      <div className="relative max-w-3xl">
        {/* Giant subtle quote icon */}
        <Quote className="absolute -left-4 -top-8 h-12 w-12 text-muted-foreground/10 rotate-180 pointer-events-none hidden sm:block" />
        
        <p className="text-xl sm:text-3xl font-medium tracking-tight text-foreground leading-relaxed sm:leading-relaxed">
          <ScrollRevealText
            text="We believe education is much more than rote memorization. Sutra AI is designed to teach students how to think—explaining why a concept exists, tracing logical problem-solving frameworks, and building true foundational mastery."
            revealType="characters"
            staggerDelay={0.015}
            blurAmount={6}
            scrollOffset={["start 0.85", "start 0.35"]}
          />
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
          Sutra AI / Cognitive Pedagogy Framework
        </span>
      </div>

      <div className="absolute left-1/2 bottom-0 h-12 w-px bg-linear-to-b from-border to-transparent" />
    </section>
  );
}
