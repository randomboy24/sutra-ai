"use client";

import {
  AlertCircleIcon,
  DatabaseIcon,
  RotateCcwIcon,
  SparklesIcon,
  BrainCircuitIcon,
  BookOpenCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { RecommendedQuestionData } from "@/lib/api";

interface RecommendedQuestionsPanelProps {
  questions: RecommendedQuestionData[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
      <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-2 h-3 w-full rounded bg-muted" />
      <div className="mb-4 h-3 w-1/2 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    Hard: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colors[difficulty] ?? colors.Medium}`}>
      {difficulty}
    </span>
  );
}

function MatchScore({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;

  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-500" :
    pct >= 60 ? "text-amber-500" :
    "text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <SparklesIcon className="h-3 w-3" />
      {pct}% match
    </span>
  );
}

function QuestionCard({ question }: { question: RecommendedQuestionData }) {
  const score = question.personalized_score;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="font-medium text-sm leading-snug">{question.text}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BookOpenCheckIcon className="h-3 w-3" />
          {question.chapter}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span>{question.subject}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={question.difficulty} />
        <MatchScore score={score} />
      </div>
    </div>
  );
}

export function RecommendedQuestionsPanel({
  questions,
  loading,
  error,
  refetch,
}: RecommendedQuestionsPanelProps) {
  if (loading) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <BrainCircuitIcon className="h-5 w-5 text-violet-500" />
            Recommended for You
          </h3>
          <p className="mt-1 text-muted-foreground text-xs">
            Questions ranked by your weakness data
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <AlertCircleIcon className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-sm">Failed to load recommendations</p>
            <p className="mt-1 text-muted-foreground text-xs">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
            <RotateCcwIcon className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <DatabaseIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">No recommendations yet</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Complete mock exams and run a weakness analysis to get personalized question recommendations tailored to your weak areas.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
            <RotateCcwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>
    );
  }

  const sorted = [...questions].sort((a, b) => {
    const sa = a.personalized_score ?? 0;
    const sb = b.personalized_score ?? 0;
    return sb - sa;
  });

  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold">
              <BrainCircuitIcon className="h-5 w-5 text-violet-500" />
              Recommended for You
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              {sorted.length} question{sorted.length !== 1 ? "s" : ""} ranked by your weakness data — higher match means more targeted practice
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={refetch}>
            <RotateCcwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
        <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
        Recommendations improve as you complete more mock exams and run weakness analysis. Use the Weakness Detection tab to analyze your performance.
      </div>
    </section>
  );
}
