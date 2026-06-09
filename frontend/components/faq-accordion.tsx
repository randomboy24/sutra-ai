"use client";

import { useState } from "react";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, MessageCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQAccordion() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Is Sutra AI just another standard chatbot tutor?",
      answer: "No. Standard study chatbots simply answer questions or give definitions verbatim, which often leads to rote memorization. Sutra AI is an autonomous academic system. It actively tracks study hours, computes diagnostic scores, isolates root-cause conceptual gaps (e.g., a division deficiency identified behind algebra drops), automatically updates timetables nightly, and intervenes proactively when students disengage.",
    },
    {
      question: "Is Sutra AI aligned with CBSE, ICSE, and Gujarat board standards?",
      answer: "Yes, fully. Sutra is pre-aligned with prominent curriculum boards. Mock tests, practice cards, previous years' files, and score calculators are custom-calibrated according to CBSE, ICSE, and state boards, matching the real exam marking patterns, timing, and question distribution perfectly.",
    },
    {
      question: "How does the AI handwritten paper evaluator work?",
      answer: "Students simply take a photo or upload a PDF of their physical handwritten school sheets. Sutra AI's vision and grading models assess the correctness of answers, presentation quality, missing technical points, and board markings. It then provides specific marking feedback, highlighting missing score steps.",
    },
    {
      question: "How does the AI Intervention Engine respond to disengaged students?",
      answer: "If a student goes offline for several days or an academic score dip is diagnosed, Sutra doesn't wait. It automatically fires a targeted intervention loop: dispatching reminders, restructuring upcoming schedules to reduce sudden study workloads, preparing easy foundation drills, and raising alert indicators on parent/mentor dashboards.",
    },
    {
      question: "What is AI Teacher Cloning and is it private?",
      answer: "Teacher Cloning allows certified schools to upload transcripts, slide outlines, and verbal explanations from their lead teachers. Sutra compiles a private, insulated model reflecting that teacher's specific style and metaphors. Students can then toggle: 'Explain this topic exactly how Mr. Sharma teaches,' maintaining 24/7 access safely and privately.",
    },
  ];

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="faq" className="mx-auto w-full max-w-4xl px-4 py-24 relative">
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="mb-16 space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
          <MessageCircle className="h-3 w-3 text-indigo-500" />
          <span>Need Clarification?</span>
        </div>
        <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
          Frequently Answered Queries
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
          Got questions about our board standards, AI evaluations, or tutoring system? Here is everything you need to know.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={idx}
              className={cn(
                "rounded-xl border bg-card transition-all duration-300",
                isExpanded ? "border-foreground/20 shadow-sm" : "hover:border-foreground/10"
              )}
            >
              <button
                onClick={() => handleToggle(idx)}
                className="flex w-full items-center justify-between p-5 text-left text-foreground hover:text-foreground/90 transition-colors"
                aria-expanded={isExpanded}
              >
                <span className="font-medium text-sm sm:text-base pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300",
                    isExpanded && "rotate-180 text-foreground"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/20">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground">
          Still have a unique query?{" "}
          <a
            href="#contact"
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            Connect with our boarding desk <ArrowUpRight className="h-3 w-3" />
          </a>
        </p>
      </div>
    </section>
  );
}
