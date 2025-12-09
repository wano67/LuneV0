"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/http";

type Json = Record<string, unknown> | Array<unknown>;

type UseApiResourceOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Json;
  enabled?: boolean;
  auth?: boolean;
};

type UseApiResourceResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export function useApiResource<T = unknown>(
  url: string | null,
  options: UseApiResourceOptions = {}
): UseApiResourceResult<T> {
  const {
    method = "GET",
    body,
    enabled = true,
    auth = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(url && enabled));
  const [error, setError] = useState<Error | null>(null);

  const fetchResource = useCallback(async () => {
    if (!url || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<T>(url, {
        method,
        body: body as any,
        auth,
      });

      setData(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [url, method, body, enabled, auth]);

  useEffect(() => {
    void fetchResource();
  }, [fetchResource]);

  const reload = useCallback(async () => {
    await fetchResource();
  }, [fetchResource]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
