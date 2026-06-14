"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchReadinessData, seedReadinessData, type ReadinessData } from "@/lib/api";

export function useExamReadiness(clerkUserId: string | null | undefined) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (_id: string) => {
      const token = await getToken();
      return fetchReadinessData(token ?? undefined);
    },
    [getToken],
  );

  return useApiResource<ReadinessData>(fetcher, clerkUserId, "Failed to load readiness data");
}

export async function seedReadinessForUser(
  token: string,
  data?: { readiness_score?: number },
) {
  return seedReadinessData(data, token);
}
