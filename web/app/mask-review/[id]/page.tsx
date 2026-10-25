"use client";

import { use } from "react";
import { FileQuestion } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import type { View } from "@/lib/hooks/useViewport";
import { MaskReviewEditor } from "@/components/mask-editor/MaskReviewEditor";
import { EmptyState } from "@/components/ui/EmptyState";

function parseView(v: string | string[] | undefined): View | null {
  if (typeof v !== "string") return null;
  const [zoom, cx, cy] = v.split(",").map(Number);
  return [zoom, cx, cy].every(Number.isFinite) ? { zoom, cx, cy } : null;
}

export default function MaskReviewPage({ params, searchParams }: PageProps<"/mask-review/[id]">) {
  const { id } = use(params);
  const query = use(searchParams);
  const t = typeof query.t === "string" ? Number(query.t) : NaN;
  const { data, loading, reload } = useData((ds) => ds.getInspection(id), [id]);

  if (loading) return null;
  if (!data) return <EmptyState icon={FileQuestion} title="Inspection not found">{id} does not exist in this data source.</EmptyState>;
  return (
    <MaskReviewEditor
      key={id}
      detail={data}
      initialThreshold={Number.isFinite(t) ? t : null}
      initialView={parseView(query.v)}
      onSaved={reload}
    />
  );
}
