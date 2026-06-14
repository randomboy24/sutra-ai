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

export interface ReadinessData {
  student_id: string;
  clerk_user_id: string;
  readiness_score: number;
  predicted_score: number;
  weak_chapters: string[];
  strong_chapters: string[];
  syllabus_coverage: number;
  confidence_level: string;
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

export interface MockQuestionOptionData {
  id: string;
  label: string;
  text: string;
  is_correct: boolean;
  display_order: number;
}

export interface MockQuestionData {
  id: string;
  board: string;
  class_level: string;
  stream: string | null;
  subject: string;
  chapter: string;
  unit: string;
  question_number: string;
  question_type: string;
  text: string;
  expected_answer: string | null;
  marks: number;
  difficulty: "Easy" | "Medium" | "Hard";
  frequency_score: number;
  importance_score: number;
  priority_score: number;
  source_year: number | null;
  options: MockQuestionOptionData[];
}

export interface MockQuestionListResponse {
  questions: MockQuestionData[];
}

export interface SeedMockQuestionsResponse {
  success: boolean;
  files_processed: number;
  sources_created: number;
  questions_created: number;
  questions_updated: number;
}

export interface MockQuestionFilters {
  board?: string;
  classLevel?: string;
  stream?: string;
  subject?: string;
  chapter?: string;
  unit?: string;
  limit?: number;
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchHealthData(token?: string): Promise<HealthData | null> {
  const res = await fetch(`${API_BASE}/api/health`, {
    headers: authHeaders(token),
  });
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
  data: SeedHealthData = {},
  token?: string,
): Promise<SeedHealthResponse> {
  const res = await fetch(`${API_BASE}/api/health/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to seed health data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchReadinessData(token?: string): Promise<ReadinessData | null> {
  const res = await fetch(`${API_BASE}/api/readiness`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch readiness data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function seedReadinessData(
  data: SeedReadinessData = {},
  token?: string,
): Promise<SeedReadinessResponse> {
  const res = await fetch(`${API_BASE}/api/readiness/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to seed readiness data" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMockQuestions(
  filters: MockQuestionFilters = {},
  token?: string,
): Promise<MockQuestionListResponse> {
  const params = new URLSearchParams({
    board: filters.board ?? "CBSE",
    class_level: filters.classLevel ?? "12th",
    stream: filters.stream ?? "science",
    limit: String(filters.limit ?? 50),
  });

  if (filters.subject) params.set("subject", filters.subject);
  if (filters.chapter) params.set("chapter", filters.chapter);
  if (filters.unit) params.set("unit", filters.unit);

  const res = await fetch(`${API_BASE}/api/mock-exams/questions?${params.toString()}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to fetch mock questions" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function seedMockQuestions(token?: string): Promise<SeedMockQuestionsResponse> {
  const res = await fetch(`${API_BASE}/api/mock-exams/seed-demo`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to seed mock questions" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
