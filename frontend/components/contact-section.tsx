"use client";

import { useState } from "react";
import * as React from "react";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Reset after brief period
      setTimeout(() => {
        setSubmitted(false);
        setFormState({ name: "", email: "", message: "" });
      }, 5000);
    }, 1200);
  };

  return (
    <section id="contact" className="mx-auto w-full max-w-5xl px-4 py-24 relative overflow-hidden">
      <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-[90px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium w-fit">
            <Mail className="h-3 w-3 text-primary animate-pulse" />
            <span>Academic Onboarding Desk</span>
          </div>

          <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
            Partner with Sutra AI Today
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Ready to integrate autonomous academic success metrics into your school, board curriculum, coaching center, or personal study plans? Write to us.
          </p>

          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background/50 text-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[11px] font-mono text-muted-foreground uppercase">Partner Desk</span>
                <span className="text-xs font-semibold text-foreground">schools@sutra.ai</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background/50 text-foreground">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <span className="block text-[11px] font-mono text-muted-foreground uppercase">AI Support</span>
                <span className="text-xs font-semibold text-foreground">Onboarding support active 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-6 sm:p-8 shadow-xs relative">
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">Request Received</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Thank you! An academic onboarding coordinator will get in touch with you or your school administration shortly.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-xs font-medium text-foreground">
                  Your Full Name or Title
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Dr. Rajesh Patel"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-xs font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="patel@school.edu"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-xs font-medium text-foreground">
                  Institution background & standard boards
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="We are looking to onboard 300 students from CBSE standard 10 and 12, and are interested in Teacher Cloning configurations..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "Transmitting..." : "Submit Onboarding Request"}
                <Send className="h-3 w-3 ml-2" />
              </Button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
