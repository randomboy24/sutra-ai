"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import { useApiResource } from "@/hooks/use-api-resource";
import {
  fetchActivePlan,
  regenerateStudyPlan,
  type StudyPlanData,
} from "@/lib/api";

export function useStudyPlanner(clerkUserId: string | null | undefined) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (_id: string) => {
      const token = await getToken();
      return fetchActivePlan(token ?? undefined);
    },
    [getToken],
  );

  const api = useApiResource<StudyPlanData>(
    fetcher,
    clerkUserId,
    "Failed to load study plan",
  );

  const regenerate = useCallback(async () => {
    const token = await getToken();
    const result = await regenerateStudyPlan({}, token ?? undefined);
    api.refetch();
    return result;
  }, [getToken, api]);

  return { ...api, regenerate };
}
