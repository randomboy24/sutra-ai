"use client";

import { useState } from "react";
import {
  HeartPulseIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  TimerIcon,
  BookOpenIcon,
  FlameIcon,
  RotateCcwIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { seedHealthForUser } from "@/hooks/use-academic-health";
import type { HealthData } from "@/lib/api";

interface AcademicHealthPanelProps {
  healthData: HealthData | null;
  loading: boolean;
  error: string | null;
  clerkUserId: string | null | undefined;
  refetch: () => void;
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "up":
      return <TrendingUpIcon className="h-4 w-4 text-emerald-500" />;
    case "down":
      return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
    default:
      return <MinusIcon className="h-4 w-4 text-muted-foreground" />;
  }
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

export function AcademicHealthPanel({
  healthData,
  loading,
  error,
  clerkUserId,
  refetch,
}: AcademicHealthPanelProps) {
  const { getToken } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!clerkUserId) return;
    const token = await getToken();
    if (!token) return;
    setSeeding(true);
    setSeedError(null);
    try {
      await seedHealthForUser(token);
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
            <p className="font-medium text-sm">Failed to load health data</p>
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

  if (!healthData) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <HeartPulseIcon className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">No health data yet</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Complete a mock exam to generate your health score, or seed demo data to preview.
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
              Demo health data seeded! Refresh to see your dashboard stats update.
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {seeded ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-800 text-sm dark:text-emerald-200">
          Demo health data seeded! Refresh to see your dashboard stats update.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={HeartPulseIcon}
          label="Health Score"
          value={String(Math.round(healthData.health_score))}
          detail={
            <span className="inline-flex items-center gap-1">
              <TrendIcon trend={healthData.trend} />
              {healthData.trend.charAt(0).toUpperCase() + healthData.trend.slice(1)}
            </span>
          }
        />
        <MetricCard
          icon={TimerIcon}
          label="Study This Week"
          value={`${healthData.study_hours_week}h`}
          detail="Hours across all subjects"
        />
        <MetricCard
          icon={BookOpenIcon}
          label="Revision"
          value={String(healthData.revision_frequency)}
          detail="Topics revised this week"
        />
        <MetricCard
          icon={FlameIcon}
          label="Streak"
          value={`${healthData.engagement_streak}d`}
          detail="Consecutive active days"
        />
      </div>

      <p className="text-muted-foreground text-xs">
        Last updated:{" "}
        {healthData.last_updated
          ? new Date(healthData.last_updated).toLocaleString()
          : "N/A"}
      </p>
    </section>
  );
}
