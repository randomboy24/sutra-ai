"use client";

import { useState } from "react";
import * as React from "react";
import { Check, ArrowRight, Sparkles, TrendingUp, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [studentCount, setStudentCount] = useState<number>(150); // Student counter slider

  const plans = [
    {
      name: "Sutra Student (B2C)",
      description: "Ideal for individual students preparing for competitive and academy board exams.",
      prefix: "$",
      monthlyPrice: 19,
      annualPrice: 14,
      features: [
        "24/7 AI Mentor Teacher access",
        "Personalized nightly study plan compile",
        "CBSE, ICSE & state boards alignment",
        "3 dynamic mock board exams monthly",
        "Critical thinking problem-solving guides",
        "Email support response in 24 hours",
      ],
      cta: "Start Student Journey",
      popular: false,
    },
    {
      name: "Sutra Academy (B2B)",
      description: "For small-to-medium coaching centers, academies, and school classrooms.",
      prefix: "$",
      monthlyPrice: 199,
      annualPrice: 159,
      features: [
        "Up to 200 active student accounts",
        "Generate institution-specific mock papers",
        "AI Paper Evaluator (PDF handwritten sheets)",
        "Deep performance analytics dashboard",
        "Optional public class leaderboards",
        "Slack & portal dedicated teacher support",
        "Adaptive simulator configuration controls",
      ],
      cta: "Onboard Your Academy",
      popular: true,
    },
    {
      name: "Sutra Enterprise",
      description: "For complete school districts, colleges, and high-volume learning centers.",
      prefix: "$",
      monthlyPrice: 499,
      annualPrice: 399,
      features: [
        "Unlimited active student seats",
        "AI Teacher Cloning (train on teacher data)",
        "CBSE, ICSE, Gujarat board native templates",
        "Branded learning portal & parent notifications",
        "Integrated central learning hub support",
        "Custom administrative dashboard & roles",
        "24/7 dedicated support SLA standard",
      ],
      cta: "Schedule School Demo",
      popular: false,
    },
  ];

  // Manual homework planning & paper grading takes about 4 hours per student per month
  const calculatePrepHoursSaved = () => {
    return Math.round(studentCount * 3.2);
  };

  return (
    <section id="pricing" className="mx-auto w-full max-w-5xl px-4 py-24 relative overflow-hidden">
      {/* Visual background blur */}
      <div className="absolute right-10 bottom-20 -z-10 h-64 w-64 rounded-full bg-indigo-500/5 blur-[80px]" />
      
      <div className="mb-16 space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
          <TrendingUp className="h-3 w-3 text-indigo-500" />
          <span>Flexible Educational Pricing</span>
        </div>
        <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
          Investment That Promotes Performance
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
          Deliver 24/7 personalized, adaptive mentoring directly, with budget-friendly subscriptions.
        </p>

        {/* Toggle Controls */}
        <div className="flex items-center justify-center pt-8">
          <div className="relative flex rounded-full border bg-muted/50 p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                billingCycle === "monthly" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Billing Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5",
                billingCycle === "annual" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Billing Annually
              <span className="inline-block rounded-full bg-emerald-500/10 dark:bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {plans.map((p, idx) => {
          const price = billingCycle === "monthly" ? p.monthlyPrice : p.annualPrice;
          return (
            <div
              key={idx}
              className={cn(
                "relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs transition-all duration-300",
                p.popular 
                  ? "border-primary/50 ring-1 ring-primary/20 shadow-md md:scale-[1.03]" 
                  : "hover:border-foreground/20 hover:shadow-md"
              )}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" /> POPULAR ACADEMY
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{p.name}</h3>
                  <p className="min-h-[48px] text-muted-foreground text-xs mt-2">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-1 py-4 border-b">
                  <span className="text-xl font-semibold text-muted-foreground">{p.prefix}</span>
                  <span className="text-4xl font-bold text-foreground tracking-tight">
                    {price.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>

                <ul className="space-y-2.5 pt-4 text-xs text-muted-foreground">
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button 
                  className="w-full" 
                  variant={p.popular ? "default" : "outline"}
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Immersive Teacher Efficiency Calculator */}
      <div className="mt-16 rounded-xl border bg-muted/20 p-6 sm:p-8 relative">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-[50px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded bg-foreground/5 px-2 py-0.5 text-[10px] font-mono text-foreground font-semibold">
              <Landmark className="h-3 w-3" /> Educational Efficiency Estimator
            </span>
            <h3 className="font-semibold text-xl text-foreground">Teacher Assessment ROI Calculator</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Formulating specific test papers, checking handwritten student feedback and adjusting files takes hours weekly. See how many assessment hours Sutra AI auto-recovers for your faculty.
            </p>
          </div>

          <div className="w-full lg:w-96 rounded-lg border bg-background/80 p-5 shadow-xs backdrop-blur-xs flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-muted-foreground">Number of Active Students</span>
              <span className="font-mono font-bold text-foreground text-sm">{studentCount} Students</span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={10}
              max={1500}
              step={10}
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="h-1.5 w-full bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <div className="bg-muted/30 rounded-lg p-3.5 flex justify-between items-center mt-2 border border-border/40">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Est. Planning Time Saved</span>
                <span className="font-bold text-emerald-500 text-lg">
                  {calculatePrepHoursSaved()} hours / mo
                </span>
              </div>
              <div className="text-[10px] text-right text-muted-foreground p-1">
                Freed from <br /> manual grading
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
