"use client";

import { useState, useMemo } from "react";
import {
  AlertCircleIcon,
  BrainCircuitIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WeaknessAnalysisData, WeaknessItemData } from "@/lib/api";

interface WeaknessPanelProps {
  weaknessData: WeaknessAnalysisData | null;
  loading: boolean;
  error: string | null;
  runAnalysis: () => Promise<WeaknessAnalysisData | null>;
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="min-h-28 rounded-lg border bg-card p-4 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 font-bold text-2xl tracking-wide">{value}</p>
      <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
        colors[severity] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {severity}
    </span>
  );
}

function AccuracyBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-yellow-500"
        : pct >= 40
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Accuracy</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WeaknessItemRow({ item }: { item: WeaknessItemData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm shadow-black/5">
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium text-sm">{item.category_name}</span>
          <SeverityBadge severity={item.severity} />
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <span>
            {item.incorrect_count}/{item.total_questions} wrong
          </span>
          {expanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Error rate</span>
            <span className="font-medium">{Math.round(item.error_rate * 100)}%</span>
          </div>
          {item.avg_time_spent !== null && (
            <div className="flex items-center justify-between">
              <span>Avg time per question</span>
              <span className="font-medium">{item.avg_time_spent}s</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Subject</span>
            <span className="font-medium capitalize">{item.subject}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frequency score</span>
            <span className="font-medium">{item.frequency_score}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Importance score</span>
            <span className="font-medium">{item.importance_score}</span>
          </div>
          {item.recommendation && (
            <div className="mt-2 rounded-md border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-violet-700 dark:text-violet-300">
              <p className="font-medium">Recommendation</p>
              <p className="mt-0.5">{item.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WeaknessAnalysisPanel({
  weaknessData,
  loading,
  error,
  runAnalysis,
  refetch,
}: WeaknessPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      await runAnalysis();
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Failed to run weakness analysis",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const sortedItems = useMemo(() => {
    if (!weaknessData) return [];
    return [...weaknessData.items].sort(
      (a, b) => b.error_rate - a.error_rate,
    );
  }, [weaknessData]);

  const criticalHighItems = useMemo(
    () => sortedItems.filter((i) => i.severity === "critical" || i.severity === "high"),
    [sortedItems],
  );

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
            <p className="font-medium text-sm">Failed to load weakness analysis</p>
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

  if (!weaknessData || !weaknessData.id) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <BrainCircuitIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">No analysis yet</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Run a weakness analysis to identify your learning gaps from mock exam attempts.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
          {analyzeError ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-800 text-sm dark:text-red-200">
              {analyzeError}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {analyzeError ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-800 text-sm dark:text-red-200">
          {analyzeError}
        </div>
      ) : null}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Last analysis:{" "}
          {weaknessData.generated_at
            ? new Date(weaknessData.generated_at).toLocaleString()
            : "N/A"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          <RotateCcwIcon className="h-4 w-4" />
          {analyzing ? "Analyzing..." : "Re-analyze"}
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BrainCircuitIcon}
          label="Weakness Score"
          value={String(Math.round(weaknessData.overall_weakness_score * 100))}
          detail={
            <span className="inline-flex items-center gap-1">
              {weaknessData.overall_weakness_score >= 0.6 ? "Needs attention" :
               weaknessData.overall_weakness_score >= 0.4 ? "Moderate gaps" :
               "Looking good"}
            </span>
          }
        />
        <MetricCard
          icon={TargetIcon}
          label="Accuracy"
          value={`${Math.round(weaknessData.overall_accuracy * 100)}%`}
          detail="Across all mock attempts"
        />
        <MetricCard
          icon={SparklesIcon}
          label="Attempts Analyzed"
          value={String(weaknessData.total_attempts_analyzed)}
          detail="Recent mock exams"
        />
        <MetricCard
          icon={TimerIcon}
          label="Questions"
          value={String(weaknessData.total_questions_analyzed)}
          detail="Across all subjects"
        />
      </div>

      {/* Accuracy bar */}
      <AccuracyBar value={weaknessData.overall_accuracy} />

      {/* Critical / High weaknesses */}
      {criticalHighItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircleIcon className="h-4 w-4 text-destructive" />
            Priority Weaknesses ({criticalHighItems.length})
          </h3>
          <div className="space-y-2">
            {criticalHighItems.map((item, i) => (
              <WeaknessItemRow key={`${item.category_type}-${item.category_name}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* All weaknesses by category */}
      {sortedItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">All Weakness Areas ({sortedItems.length})</h3>
          <div className="space-y-2">
            {sortedItems.map((item, i) => (
              <WeaknessItemRow key={`all-${item.category_type}-${item.category_name}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
