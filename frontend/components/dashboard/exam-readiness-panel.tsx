"use client";

import { useState } from "react";
import {
  GaugeIcon,
  TrendingUpIcon,
  BookOpenCheckIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  AlertCircleIcon,
  SparklesIcon,
  BrainCircuitIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { seedReadinessForUser } from "@/hooks/use-exam-readiness";
import type { ReadinessData } from "@/lib/api";

interface ExamReadinessPanelProps {
  readinessData: ReadinessData | null;
  loading: boolean;
  error: string | null;
  clerkUserId: string | null | undefined;
  refetch: () => void;
}

function MetricSkeleton() {
  return (
    <div className="min-h-28 animate-pulse rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
      <div className="mb-3 h-4 w-20 rounded bg-muted" />
      <div className="mb-2 h-7 w-16 rounded bg-muted" />
      <div className="h-3 w-24 rounded bg-muted" />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`min-h-28 rounded-lg border bg-card p-4 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-md ${accent ?? ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-bold text-2xl tracking-wide">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${colors[level] ?? colors.medium}`}>
      <SparklesIcon className="h-3 w-3" />
      {level.charAt(0).toUpperCase() + level.slice(1)} confidence
    </span>
  );
}

function ChapterList({
  chapters,
  type,
}: {
  chapters: string[];
  type: "weak" | "strong";
}) {
  if (chapters.length === 0) return <p className="text-muted-foreground text-xs italic">None listed</p>;
  const Icon = type === "weak" ? AlertTriangleIcon : CheckCircle2Icon;
  const color = type === "weak"
    ? "text-red-700 dark:text-red-300"
    : "text-emerald-700 dark:text-emerald-300";
  return (
    <ul className="space-y-1.5">
      {chapters.map((chapter) => (
        <li key={chapter} className="flex items-center gap-2 text-sm">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
          <span>{chapter}</span>
          {type === "weak" && (
            <span className="ml-auto text-muted-foreground text-xs">Needs revision</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ExamReadinessPanel({
  readinessData,
  loading,
  error,
  clerkUserId,
  refetch,
}: ExamReadinessPanelProps) {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!clerkUserId) return;
    setSeeding(true);
    setSeedError(null);
    setSeeded(false);
    try {
      await seedReadinessForUser(clerkUserId);
      setSeeded(true);
      refetch();
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
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
            <p className="font-medium text-sm">Failed to load readiness data</p>
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

  if (!readinessData) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <GaugeIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">No readiness data yet</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Complete mock exams to generate your readiness score, or seed demo data to preview.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSeed}
            disabled={seeding || !clerkUserId}
          >
            {seeding ? "Seeding..." : "Seed Demo Data"}
          </Button>
          {seedError ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-800 text-sm dark:text-red-200">
              {seedError}
            </div>
          ) : null}
          {seeded ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-800 text-sm dark:text-emerald-200">
              Demo readiness data seeded! Refresh to see your dashboard stats update.
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const readinessColor =
    readinessData.readiness_score >= 80
      ? "text-emerald-500"
      : readinessData.readiness_score >= 50
        ? "text-amber-500"
        : "text-red-500";

  return (
    <section className="space-y-4">
      {seeded && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-800 text-sm dark:text-emerald-200">
          Demo readiness data seeded! Refresh to see your dashboard stats update.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={GaugeIcon}
          label="Readiness Score"
          value={<span className={readinessColor}>{Math.round(readinessData.readiness_score)}%</span>}
          detail="Overall exam preparedness"
        />
        <MetricCard
          icon={TrendingUpIcon}
          label="Predicted Score"
          value={`${Math.round(readinessData.predicted_score)}%`}
          detail="Expected marks in exam"
        />
        <MetricCard
          icon={BrainCircuitIcon}
          label="Weak Chapters"
          value={String(readinessData.weak_chapters.length)}
          detail="Chapters needing revision"
        />
        <MetricCard
          icon={BookOpenCheckIcon}
          label="Syllabus Coverage"
          value={`${Math.round(readinessData.syllabus_coverage)}%`}
          detail="Curriculum completed"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
          <h4 className="mb-3 flex items-center gap-2 font-medium text-sm">
            <AlertTriangleIcon className="h-4 w-4 text-red-500" />
            Weak Chapters
          </h4>
          <ChapterList chapters={readinessData.weak_chapters} type="weak" />
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm shadow-black/5">
          <h4 className="mb-3 flex items-center gap-2 font-medium text-sm">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
            Strong Chapters
          </h4>
          <ChapterList chapters={readinessData.strong_chapters} type="strong" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ConfidenceBadge level={readinessData.confidence_level} />
        <p className="text-muted-foreground text-xs">
          Last updated:{" "}
          {readinessData.last_updated
            ? new Date(readinessData.last_updated).toLocaleString()
            : "N/A"}
        </p>
      </div>
    </section>
  );
}
