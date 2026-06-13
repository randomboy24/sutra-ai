"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useApiResource<T>(
  fetcher: (clerkUserId: string) => Promise<T | null>,
  clerkUserId: string | null | undefined,
  errorMessage: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!clerkUserId) {
      requestIdRef.current += 1;
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(clerkUserId);
      if (requestId !== requestIdRef.current) return;
      if (result === null) {
        setData(null);
        setError(null);
      } else {
        setData(result);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : errorMessage);
      setData(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [clerkUserId, fetcher, errorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
