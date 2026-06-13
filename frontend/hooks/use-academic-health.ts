"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchHealthData, seedHealthData, type HealthData } from "@/lib/api";

export function useAcademicHealth(clerkUserId: string | null | undefined) {
  const [data, setData] = useState<HealthData | null>(null);
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
      const result = await fetchHealthData(clerkUserId);
      if (requestId !== requestIdRef.current) return;
      if (result === null) {
        setData(null);
        setError(null);
      } else {
        setData(result);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load health data");
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

export async function seedHealthForUser(
  clerkUserId: string,
  data?: { health_score?: number },
) {
  return seedHealthData(clerkUserId, data);
}
