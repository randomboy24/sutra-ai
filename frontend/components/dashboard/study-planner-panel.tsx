"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  FlameIcon,
  ListChecksIcon,
  Loader2Icon,
  RotateCcwIcon,
  TargetIcon,
  TimerIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  generateStudyPlan,
  patchTask,
  type StudyPlanData,
  type StudyTaskData,
} from "@/lib/api";

const TASK_TYPE_META: Record<string, { label: string; color: string }> = {
  study: { label: "Study", color: "border-l-blue-500" },
  practice: { label: "Practice", color: "border-l-emerald-500" },
  review: { label: "Review", color: "border-l-amber-500" },
  mock_exam: { label: "Mock Exam", color: "border-l-violet-500" },
};

function TaskRow({
  task,
  onToggle,
}: {
  task: StudyTaskData;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const meta = TASK_TYPE_META[task.task_type] ?? {
    label: task.task_type,
    color: "border-l-gray-500",
  };

  return (
    <div
      className={`flex items-start gap-3 border-l-4 bg-card p-4 shadow-sm shadow-black/5 transition hover:brightness-95 ${meta.color} ${task.completed ? "opacity-60" : ""} rounded-lg border`}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0"
        onClick={() => onToggle(task.id, !task.completed)}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed ? (
          <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
        ) : (
          <CircleIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-xs">
            {meta.label}
          </span>
          <span className="text-sm font-medium">{task.session_label}</span>
        </div>

        {task.description ? (
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            {task.description}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock3Icon className="h-3 w-3" />
            {task.duration_minutes} min
          </span>
          {task.subject ? (
            <span className="inline-flex items-center gap-1">
              <TargetIcon className="h-3 w-3" />
              {task.subject}
            </span>
          ) : null}
          {task.chapter ? (
            <span className="inline-flex items-center gap-1">
              {task.chapter}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-4">
      <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

// ── Empty state: no plan yet ─────────────────────────────────────────────────

function GeneratePlanForm({
  onGenerated,
  clerkUserId,
}: {
  onGenerated: () => void;
  clerkUserId: string | null | undefined;
}) {
  const { getToken } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyHours, setDailyHours] = useState(2);
  const [examDatesInput, setExamDatesInput] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!clerkUserId) return;
    setGenerating(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const examDates: Record<string, string> = {};
      if (examDatesInput.trim()) {
        // Parse "subject1:YYYY-MM-DD, subject2:YYYY-MM-DD"
        for (const pair of examDatesInput.split(",")) {
          const trimmed = pair.trim();
          if (!trimmed) continue;
          const colonIdx = trimmed.lastIndexOf(":");
          if (colonIdx > 0) {
            const subject = trimmed.slice(0, colonIdx).trim();
            const dateStr = trimmed.slice(colonIdx + 1).trim();
            if (subject && dateStr) {
              examDates[subject] = dateStr;
            }
          }
        }
      }

      await generateStudyPlan(
        {
          exam_dates: examDates,
          daily_hours: dailyHours,
        },
        token,
      );
      onGenerated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate plan",
      );
    } finally {
      setGenerating(false);
    }
  }, [clerkUserId, getToken, dailyHours, examDatesInput, onGenerated]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <h3 className="font-semibold">Generate Your Study Plan</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Set your exam dates and daily study budget. The planner will build a
          day-by-day schedule from your weak areas.
        </p>

        <div className="mt-5 space-y-4">
          {/* Daily hours */}
          <div>
            <label className="mb-1.5 block font-medium text-sm">
              Daily study hours
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="h-2 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
              <span className="min-w-[3rem] text-right font-mono text-sm">
                {dailyHours}h
              </span>
            </div>
          </div>

          {/* Exam dates */}
          <div>
            <label className="mb-1.5 block font-medium text-sm">
              Exam dates{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Physics:2026-03-15, Chemistry:2026-03-20"
              value={examDatesInput}
              onChange={(e) => setExamDatesInput(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-muted-foreground text-xs">
              Comma-separated &quot;Subject:YYYY-MM-DD&quot; pairs
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-800 text-sm dark:text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            className="gap-2"
            disabled={generating || !clerkUserId}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CalendarClockIcon className="h-4 w-4" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Plan loaded state ────────────────────────────────────────────────────────

function PlanOverview({ plan }: { plan: StudyPlanData }) {
  const completedCount = plan.tasks.filter((t) => t.completed).length;
  const progressPct =
    plan.tasks.length > 0
      ? Math.round((completedCount / plan.tasks.length) * 100)
      : 0;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 font-semibold text-lg">
        <CalendarClockIcon className="h-5 w-5 text-primary" />
        {plan.name}
      </h2>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3 shadow-sm shadow-black/5">
          <p className="text-muted-foreground text-xs">Days</p>
          <p className="mt-1 font-bold text-2xl">{plan.total_days}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-sm shadow-black/5">
          <p className="text-muted-foreground text-xs">Daily hours</p>
          <p className="mt-1 font-bold text-2xl">{plan.daily_hours}h</p>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-sm shadow-black/5">
          <p className="text-muted-foreground text-xs">Completed</p>
          <p className="mt-1 font-bold text-2xl">
            {completedCount}/{plan.tasks.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 shadow-sm shadow-black/5">
          <p className="text-muted-foreground text-xs">Status</p>
          <p className="mt-1 inline-flex items-center gap-1 font-bold text-sm capitalize text-emerald-600 dark:text-emerald-400">
            <FlameIcon className="h-4 w-4" />
            {plan.status}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </section>
  );
}

function TodayTasks({
  tasks,
  onToggle,
}: {
  tasks: StudyTaskData[];
  onToggle: (id: string, completed: boolean) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <ListChecksIcon className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">No tasks for today</p>
          <p className="text-muted-foreground text-xs">
            Check back tomorrow or review upcoming days in your plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-medium text-sm">
        <TimerIcon className="h-4 w-4 text-muted-foreground" />
        Today&apos;s Tasks
      </h3>
      <div className="grid gap-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

interface StudyPlannerPanelProps {
  planData: StudyPlanData | null;
  loading: boolean;
  error: string | null;
  clerkUserId: string | null | undefined;
  refetch: () => void;
}

export function StudyPlannerPanel({
  planData,
  loading,
  error,
  clerkUserId,
  refetch,
}: StudyPlannerPanelProps) {
  const { getToken } = useAuth();
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().slice(0, 10);

  const todayTasks =
    planData?.tasks.filter((t) => t.scheduled_date === today) ?? [];

  const handleToggle = useCallback(
    async (taskId: string, completed: boolean) => {
      setTogglingIds((prev) => new Set(prev).add(taskId));
      try {
        const token = await getToken();
        await patchTask(taskId, completed, token ?? undefined);
        refetch();
      } catch {
        // Silently fail — user can retry
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [getToken, refetch],
  );

  const handleGenerated = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="animate-pulse rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
          <div className="mb-4 h-7 w-48 rounded bg-muted" />
          <div className="grid gap-3 sm:grid-cols-4">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </div>
        </div>
        <div className="space-y-2">
          <TaskSkeleton />
          <TaskSkeleton />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm shadow-black/5">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <AlertCircleIcon className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium text-sm">Failed to load study plan</p>
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

  // No plan — show generate form
  if (!planData) {
    return (
      <GeneratePlanForm
        clerkUserId={clerkUserId}
        onGenerated={handleGenerated}
      />
    );
  }

  // Plan loaded
  return (
    <section className="space-y-6">
      <PlanOverview plan={planData} />
      <TodayTasks tasks={todayTasks} onToggle={handleToggle} />

      {/* All tasks collapsible */}
      <details className="rounded-lg border bg-card shadow-sm shadow-black/5">
        <summary className="cursor-pointer px-5 py-3 font-medium text-sm hover:bg-accent/30">
          All {planData.tasks.length} Tasks
        </summary>
        <div className="grid gap-2 border-t px-5 py-4">
          {planData.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} />
          ))}
        </div>
      </details>
    </section>
  );
}
