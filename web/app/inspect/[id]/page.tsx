"use client";

import { use } from "react";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import { InspectionWorkspace } from "@/components/inspection/InspectionWorkspace";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function InspectionPage({ params }: PageProps<"/inspect/[id]">) {
  const { id } = use(params);
  const { data, loading, reload } = useData((ds) => ds.getInspection(id), [id]);

  if (loading) return null;
  if (!data)
    return (
      <EmptyState
        icon={FileQuestion}
        title="Inspection not found"
        action={
          <Link href="/inspect">
            <Button>New inspection</Button>
          </Link>
        }
      >
        {id} does not exist in this data source.
      </EmptyState>
    );
  return <InspectionWorkspace key={data.inspection.inspection_id} detail={data} onChanged={reload} />;
}
