"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import { isPending, StatusBadge } from "@/components/status/StatusBadge";
import { Thumbnail } from "@/components/queue/Thumbnail";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

function Stat({ label, value, href }: { label: string; value: number | undefined; href?: string }) {
  const body = (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums">{value ?? "–"}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const { data } = useData((ds) => ds.listInspections());
  const recent = data?.slice(0, 8) ?? [];

  return (
    <>
      <PageHeader title="Dashboard">
        <Link href="/inspect">
          <Button variant="primary">
            <Plus size={14} strokeWidth={2} /> New inspection
          </Button>
        </Link>
      </PageHeader>
      <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total inspections" value={data?.length} />
          <Stat label="Pending reviews" value={data?.filter((i) => isPending(i.status)).length} href="/review" />
          <Stat label="Confirmed defects" value={data?.filter((i) => i.confirmed_defect).length} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-medium">Recent inspections</h2>
            {recent.length > 0 && (
              <Link href="/review" className="text-[12px] text-muted hover:text-text">
                View queue
              </Link>
            )}
          </div>
          {data && recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border-strong px-4 py-10 text-center text-[13px] text-muted">
              No inspections yet. Upload a product image to start.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {recent.map((i) => (
                <Link key={i.inspection_id} href={`/inspect/${i.inspection_id}`} className="group block">
                  <Thumbnail uri={i.image.uri} className="aspect-square rounded-lg border border-border group-hover:border-border-strong" />
                  <div className="mt-1.5 space-y-1">
                    <p className="truncate font-mono text-[11px] text-muted">{i.inspection_id}</p>
                    <StatusBadge status={i.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
