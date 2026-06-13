const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ReadinessData {
  student_id: string;
  clerk_user_id: string;
  readiness_score: number;
  predicted_score: number;
  weak_chapters: string[];
  strong_chapters: string[];
  syllabus_coverage: number;
  confidence_level: string;
  mock_accuracy: number;
  last_updated: string | null;
}

export interface SeedReadinessData {
  readiness_score?: number;
  predicted_score?: number;
  weak_chapters?: string[];
  strong_chapters?: string[];
  syllabus_coverage?: number;
  confidence_level?: string;
}

export interface SeedReadinessResponse {
  success: boolean;
  message: string;
}

export async function fetchReadinessData(clerkUserId: string): Promise<ReadinessData> {
  const res = await fetch(`${API_BASE}/api/readiness/${encodeURIComponent(clerkUserId)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch readiness data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function seedReadinessData(
  clerkUserId: string,
  data: SeedReadinessData = {},
): Promise<SeedReadinessResponse> {
  const res = await fetch(`${API_BASE}/api/readiness/seed/${encodeURIComponent(clerkUserId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to seed readiness data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}
