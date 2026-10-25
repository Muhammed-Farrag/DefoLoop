import { HttpDataSource } from "./http";
import { LocalDataSource } from "./local";
import type { DataSource } from "./source";

let source: DataSource | null = null;

/** HTTP backend when NEXT_PUBLIC_API_URL is set, otherwise the local demo store. */
export function getDataSource(): DataSource {
  const base = process.env.NEXT_PUBLIC_API_URL;
  source ??= base ? new HttpDataSource(base.replace(/\/+$/, "")) : new LocalDataSource();
  return source;
}

export type * from "./types";
export type { DataSource } from "./source";
