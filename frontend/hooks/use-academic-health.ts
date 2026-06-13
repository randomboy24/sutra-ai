"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchHealthData, seedHealthData, type HealthData } from "@/lib/api";

export function useAcademicHealth(clerkUserId: string | null | undefined) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clerkUserId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHealthData(clerkUserId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health data");
      setData(null);
    } finally {
      setLoading(false);
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
