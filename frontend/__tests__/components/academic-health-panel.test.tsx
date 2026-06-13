import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicHealthPanel } from "@/components/dashboard/academic-health-panel";

vi.mock("lucide-react", () => ({
  HeartPulseIcon: () => <svg data-testid="heart-icon" />,
  TrendingUpIcon: () => <svg data-testid="trend-up" />,
  TrendingDownIcon: () => <svg data-testid="trend-down" />,
  MinusIcon: () => <svg data-testid="trend-stable" />,
  TimerIcon: () => <svg data-testid="timer" />,
  BookOpenIcon: () => <svg data-testid="book" />,
  FlameIcon: () => <svg data-testid="flame" />,
  AlertCircleIcon: () => <svg data-testid="alert" />,
  RotateCcwIcon: () => <svg data-testid="retry" />,
}));

vi.mock("@/hooks/use-academic-health", () => ({
  seedHealthForUser: vi.fn(),
}));

const mockHealthData = {
  student_id: "stu-1",
  clerk_user_id: "clerk-1",
  health_score: 82.5,
  trend: "up",
  study_hours_week: 12.5,
  revision_frequency: 8,
  engagement_streak: 5,
  mock_accuracy: 74.0,
  last_updated: "2026-06-13T10:30:00Z",
};

describe("AcademicHealthPanel", () => {
  it("renders loading state", () => {
    const { container } = render(
      <AcademicHealthPanel
        healthData={null}
        loading={true}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("renders error state", () => {
    render(
      <AcademicHealthPanel
        healthData={null}
        loading={false}
        error="API Error"
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("Failed to load health data")).toBeDefined();
    expect(screen.getByText("API Error")).toBeDefined();
    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("renders empty/no data state", () => {
    render(
      <AcademicHealthPanel
        healthData={null}
        loading={false}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("No health data yet")).toBeDefined();
    expect(screen.getByText("Seed Demo Data")).toBeDefined();
  });

  it("renders loaded state with health data", () => {
    render(
      <AcademicHealthPanel
        healthData={mockHealthData}
        loading={false}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("83")).toBeDefined();
    expect(screen.getByText("12.5h")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
    expect(screen.getByText("5d")).toBeDefined();
  });

  it("renders up trend", () => {
    render(
      <AcademicHealthPanel
        healthData={{ ...mockHealthData, trend: "up" }}
        loading={false}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("Up")).toBeDefined();
  });

  it("renders down trend", () => {
    render(
      <AcademicHealthPanel
        healthData={{ ...mockHealthData, trend: "down" }}
        loading={false}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("Down")).toBeDefined();
  });

  it("renders stable trend", () => {
    render(
      <AcademicHealthPanel
        healthData={{ ...mockHealthData, trend: "stable" }}
        loading={false}
        error={null}
        clerkUserId="clerk-1"
        refetch={vi.fn()}
      />,
    );
    expect(screen.getByText("Stable")).toBeDefined();
  });
});
