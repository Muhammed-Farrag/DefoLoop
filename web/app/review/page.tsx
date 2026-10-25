"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import { isPending } from "@/components/status/StatusBadge";
import { QueueItem } from "@/components/queue/QueueItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function ReviewQueuePage() {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const { data, loading } = useData((ds) => ds.listInspections());
  const items = (data ?? []).filter((i) => filter === "all" || isPending(i.status));

  return (
    <>
      <PageHeader title="Review Queue">
        <div className="flex rounded-md bg-surface-2 p-0.5" role="radiogroup" aria-label="Filter">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={`h-7 rounded px-2.5 text-[12px] capitalize ${
                filter === f ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              {f}
              {f === "pending" && data && ` (${data.filter((i) => isPending(i.status)).length})`}
            </button>
          ))}
        </div>
      </PageHeader>
      {!loading && items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={filter === "pending" ? "No images awaiting review" : "No inspections yet"}
          action={
            <Link href="/inspect">
              <Button variant="primary">New inspection</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 p-6">
          {items.map((i) => (
            <QueueItem key={i.inspection_id} inspection={i} />
          ))}
        </div>
      )}
    </>
  );
}
