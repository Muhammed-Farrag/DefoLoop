"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] transition-colors ${
        active
          ? "bg-surface font-medium text-text shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-border"
          : "text-muted hover:bg-sidebar-hover hover:text-text"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      {active && (
        <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" aria-hidden />
      )}
      <Icon size={17} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
