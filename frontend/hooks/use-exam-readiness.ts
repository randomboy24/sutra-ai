"use client";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchReadinessData, seedReadinessData, type ReadinessData } from "@/lib/api";

export function useExamReadiness(clerkUserId: string | null | undefined) {
  return useApiResource<ReadinessData>(
    fetchReadinessData,
    clerkUserId,
    "Failed to load readiness data",
  );
}

export async function seedReadinessForUser(
  clerkUserId: string,
  data?: { readiness_score?: number },
) {
  return seedReadinessData(clerkUserId, data);
}
