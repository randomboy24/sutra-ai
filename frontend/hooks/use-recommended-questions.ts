"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import { useApiResource } from "@/hooks/use-api-resource";
import {
  fetchRecommendedQuestions,
  type MockQuestionData,
} from "@/lib/api";

export function useRecommendedQuestions(
  clerkUserId: string | null | undefined,
  subject?: string,
  difficulty?: string,
) {
  const { getToken } = useAuth();

  const fetcher = useCallback(
    async (_id: string) => {
      const token = await getToken();
      const result = await fetchRecommendedQuestions(
        token ?? "",
        { subject, difficulty, limit: 10 },
      );
      return result.questions;
    },
    [getToken, subject, difficulty],
  );

  return useApiResource<MockQuestionData[]>(
    fetcher,
    clerkUserId,
    "Failed to load recommended questions",
  );
}
