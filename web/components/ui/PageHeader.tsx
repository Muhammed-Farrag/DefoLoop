import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <h1 className="text-[15px] font-semibold">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
