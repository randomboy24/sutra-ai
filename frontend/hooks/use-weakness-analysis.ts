"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import { useApiResource } from "@/hooks/use-api-resource";
import {
  fetchWeaknessAnalysis,
  triggerWeaknessAnalysis,
  type WeaknessAnalysisData,
} from "@/lib/api";

export function useWeaknessAnalysis(clerkUserId: string | null | undefined) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (_id: string) => {
      const token = await getToken();
      return fetchWeaknessAnalysis(token ?? undefined);
    },
    [getToken],
  );

  const api = useApiResource<WeaknessAnalysisData>(
    fetcher,
    clerkUserId,
    "Failed to load weakness analysis",
  );

  const runAnalysis = useCallback(async () => {
    const token = await getToken();
    const result = await triggerWeaknessAnalysis(token ?? undefined);
    api.refetch();
    return result;
  }, [getToken, api]);

  return { ...api, runAnalysis };
}
