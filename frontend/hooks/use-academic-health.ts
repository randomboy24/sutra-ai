"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchHealthData, seedHealthData, type HealthData } from "@/lib/api";

export function useAcademicHealth(clerkUserId: string | null | undefined) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (_id: string) => {
      const token = await getToken();
      return fetchHealthData(token ?? undefined);
    },
    [getToken],
  );

  return useApiResource<HealthData>(fetcher, clerkUserId, "Failed to load health data");
}

export async function seedHealthForUser(
  token: string,
  data?: { health_score?: number },
) {
  return seedHealthData(data, token);
}
