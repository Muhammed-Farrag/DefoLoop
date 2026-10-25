"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brush } from "lucide-react";
import { useData } from "@/lib/hooks/useData";
import { isPending } from "@/components/status/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

/** Opens the oldest inspection still waiting for a human decision. */
export default function MaskReviewIndex() {
  const router = useRouter();
  const { data, loading } = useData((ds) => ds.listInspections());
  const next = data?.filter((i) => isPending(i.status)).at(-1);

  useEffect(() => {
    if (next) router.replace(`/mask-review/${next.inspection_id}`);
  }, [next, router]);

  if (loading || next) return null;
  return (
    <>
      <PageHeader title="Human Mask Review" />
      <EmptyState
        icon={Brush}
        title="Nothing waiting for correction"
        action={
          <Link href="/inspect">
            <Button variant="primary">New inspection</Button>
          </Link>
        }
      >
        Every inspection has been reviewed. Open any inspection and choose Correct mask to edit it again.
      </EmptyState>
    </>
  );
}
