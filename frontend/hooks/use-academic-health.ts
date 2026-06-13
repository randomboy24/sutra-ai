"use client";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchHealthData, seedHealthData, type HealthData } from "@/lib/api";

export function useAcademicHealth(clerkUserId: string | null | undefined) {
  return useApiResource<HealthData>(
    fetchHealthData,
    clerkUserId,
    "Failed to load health data",
  );
}

export async function seedHealthForUser(
  clerkUserId: string,
  data?: { health_score?: number },
) {
  return seedHealthData(clerkUserId, data);
}
