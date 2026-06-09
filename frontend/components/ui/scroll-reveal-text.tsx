"use client";

import { useRef, useMemo } from "react";
import * as React from "react";
import { useScroll, useTransform, motion, MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollRevealTextProps {
  text: string;
  revealType?: "characters" | "words";
  staggerDelay?: number; // fallback or multiplier
  blurAmount?: number;
  scrollOffset?: [string, string];
  className?: string;
}

export function ScrollRevealText({
  text,
  revealType = "characters",
  staggerDelay = 0.02,
  blurAmount = 8,
  scrollOffset = ["start 0.9", "start 0.2"],
  className,
}: ScrollRevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: scrollOffset as any,
  });

  // Split content based on type
  const tokens = useMemo(() => {
    if (revealType === "words") {
      return text.split(" ");
    }
    // "characters"
    return Array.from(text);
  }, [text, revealType]);

  return (
    <span ref={containerRef} className={cn("inline-wrap relative", className)}>
      {tokens.map((token, index) => {
        return (
          <Token
            key={`${token}-${index}`}
            token={token}
            index={index}
            total={tokens.length}
            progress={scrollYProgress}
            blurAmount={blurAmount}
            revealType={revealType}
          />
        );
      })}
    </span>
  );
}

interface TokenProps {
  key?: string;
  token: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  blurAmount: number;
  revealType: "characters" | "words";
}

function Token({ token, index, total, progress, blurAmount, revealType }: TokenProps) {
  // Distribute the focus/reveal active range across the scroll distance
  // Simple formula: each token starts revealing at index/total, and completes after a small interval.
  const start = index / total;
  const end = Math.min(1, (index + 1) / total);

  // Smooth transforms based on scroll percentage
  const opacity = useTransform(progress, [0, start, end, 1], [0.15, 0.15, 1, 1]);
  const blur = useTransform(
    progress,
    [0, start, end, 1],
    [`blur(${blurAmount}px)`, `blur(${blurAmount}px)`, "blur(0px)", "blur(0px)"]
  );
  const y = useTransform(progress, [0, start, end, 1], [4, 4, 0, 0]);

  // Handle spacing
  const needsTrailingSpace = revealType === "words";

  return (
    <motion.span
      style={{ opacity, filter: blur, y }}
      className="inline-block transition-all duration-75 text-foreground selection:bg-primary/20"
    >
      {token === " " ? "\u00A0" : token}
      {needsTrailingSpace && "\u00A0"}
    </motion.span>
  );
}
