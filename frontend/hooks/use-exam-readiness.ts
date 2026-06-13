"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchReadinessData, seedReadinessData, type ReadinessData } from "@/lib/api";

export function useExamReadiness(clerkUserId: string | null | undefined) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!clerkUserId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchReadinessData(clerkUserId);
      if (requestId !== requestIdRef.current) return;
      if (result === null) {
        setData(null);
        setError(null);
      } else {
        setData(result);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load readiness data");
      setData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [clerkUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export async function seedReadinessForUser(
  clerkUserId: string,
  data?: { readiness_score?: number },
) {
  return seedReadinessData(clerkUserId, data);
}
