const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface HealthData {
  student_id: string;
  clerk_user_id: string;
  health_score: number;
  trend: string;
  study_hours_week: number;
  revision_frequency: number;
  engagement_streak: number;
  mock_accuracy: number;
  last_updated: string | null;
}

export interface SeedHealthData {
  health_score?: number;
  trend?: string;
  study_hours_week?: number;
  revision_frequency?: number;
  engagement_streak?: number;
}

export interface SeedHealthResponse {
  success: boolean;
  message: string;
}

export async function fetchHealthData(clerkUserId: string): Promise<HealthData | null> {
  const res = await fetch(`${API_BASE}/api/health/${encodeURIComponent(clerkUserId)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch health data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function seedHealthData(
  clerkUserId: string,
  data: SeedHealthData = {},
): Promise<SeedHealthResponse> {
  const res = await fetch(`${API_BASE}/api/health/seed/${encodeURIComponent(clerkUserId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to seed health data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
