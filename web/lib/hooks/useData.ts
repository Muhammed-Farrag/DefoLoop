"use client";

import { useCallback, useEffect, useState } from "react";
import { getDataSource } from "@/lib/api";

/** Loads async data from the active DataSource; `reload` re-runs the loader. */
export function useData<T>(load: (ds: ReturnType<typeof getDataSource>) => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | undefined; error: Error | null; loading: boolean }>({
    data: undefined,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    load(getDataSource())
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error: Error) => alive && setState({ data: undefined, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { ...state, reload };
}

/** Resolves a stored URI (e.g. idb://) to a loadable URL. */
export function useResolvedUri(uri: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!uri) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear when the source goes away
      setUrl(null);
      return;
    }
    getDataSource()
      .resolveUri(uri)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [uri]);
  return url;
}
