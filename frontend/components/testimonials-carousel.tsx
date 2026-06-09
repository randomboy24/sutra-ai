"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { TestimonialsColumn, TestimonialItem } from "@/components/blocks/testimonials-columns-1";

const testimonialsList: TestimonialItem[] = [
  {
    text: "Since onboarding our secondary students onto Sutra AI, our average mock score shot up from 61% to 84%. The AI accurately diagnosed root-cause division gaps that standard curriculums had missed for years.",
    name: "Dr. Rajesh Patel",
    role: "Director of DPS Academy",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    text: "The AI Teacher Cloning is futuristic yet practical. It replication of my teaching style has supported students 24/7. My students' readiness grew to 91% within weeks, saving me countless grading hours.",
    name: "Mr. R. Sharma",
    role: "Senior Science Faculty, CBSE coaching",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    text: "The Adaptive simulator and paper evaluator felt exactly like sitting for my actual state board papers. Knowing my predicted grade beforehand gave me extreme confidence.",
    name: "Siddharth Mehta",
    role: "12th Standard CBSE Topper",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    text: "My son's grades dipped, but instead of waiting, Sutra's Intervention Engine automatically compiled easier drills, shifted his study schedule, and re-engaged him proactively. Simply magical.",
    name: "Priya Nair",
    role: "Parent of 10th standard student",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    text: "Generating different standard mock papers (CBSE, ICSE, and Gujarat board) instantly has completely freed our coaches. Our preparation cycles went from days to seconds.",
    name: "Dr. Anand Joshi",
    role: "Founder, Joshi Science Institutes",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    text: "Most systems are just glorified study chatbots. Sutra AI is a true autonomous academic success system that takes actions proactively. Our administration is thoroughly impressed.",
    name: "Dean Abha Verma",
    role: "Delhi Academic High",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80",
  }
];

export function TestimonialsCarousel() {
  // Distribute testimonials among the columns
  const firstColumn = [testimonialsList[0], testimonialsList[3]];
  const secondColumn = [testimonialsList[1], testimonialsList[4]];
  const thirdColumn = [testimonialsList[2], testimonialsList[5]];

  return (
    <section id="testimonials" className="mx-auto w-full max-w-5xl px-4 py-24 relative overflow-hidden">
      {/* Visual background glowing orbs */}
      <div className="absolute top-1/4 -left-12 -z-10 h-72 w-72 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-12 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Header section with VP-level typography and visual discipline */}
      <div className="mb-16 space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span>Measurable Academic Improvements</span>
        </div>
        <h2 className="text-balance font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
          What Prominent Educators Say About Sutra AI
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground text-sm sm:text-base">
          Real results and stories from schools, coaching directors, parents, and academic toppers.
        </p>
      </div>

      {/* The scrolling columns container */}
      <div className="relative h-[540px] overflow-hidden rounded-2xl border border-border bg-muted/10 backdrop-blur-xs p-6 md:px-10 py-0 flex items-center justify-center">
        
        {/* Transparent gradient mask for top and bottom fades with border-radius coordination */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background via-background/70 to-transparent z-20 pointer-events-none rounded-t-2xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/70 to-transparent z-20 pointer-events-none rounded-b-2xl" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full w-full items-start overflow-hidden pt-6">
          {/* Column 1 */}
          <TestimonialsColumn 
            testimonials={firstColumn} 
            duration={16} 
            className="flex flex-col h-full overflow-hidden"
          />

          {/* Column 2 */}
          <TestimonialsColumn 
            testimonials={secondColumn} 
            duration={22} 
            className="hidden md:flex flex-col h-full overflow-hidden"
          />

          {/* Column 3 */}
          <TestimonialsColumn 
            testimonials={thirdColumn} 
            duration={18} 
            className="hidden lg:flex flex-col h-full overflow-hidden"
          />
        </div>
      </div>
    </section>
  );
}
