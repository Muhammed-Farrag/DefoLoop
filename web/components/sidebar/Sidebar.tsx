"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brush,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
} from "lucide-react";
import { NavItem } from "./NavItem";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspect", label: "Inspect", icon: ScanSearch },
  { href: "/review", label: "Review Queue", icon: ListChecks },
  { href: "/mask-review", label: "Human Mask Review", icon: Brush },
  { href: "/learning", label: "Learning Impact", icon: BarChart3 },
];

const STORAGE_KEY = "defoloop.sidebar.collapsed";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** The supplied logo, unmodified. Collapsed, it is cropped by CSS to the "O" ring. */
function Logo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    // Source is 1333×955; the ring occupies x 641–929, y 391–670.
    const s = 28 / 292;
    return (
      <span className="relative block h-[28px] w-[28px] overflow-hidden" aria-label="DefoLoop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-light.png"
          alt=""
          className="absolute max-w-none"
          style={{ width: 1333 * s, height: 955 * s, left: -639 * s, top: -385 * s }}
        />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-light.png" alt="DefoLoop" className="h-8 w-auto" />
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted UI preference after hydration
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-border-strong bg-sidebar transition-[width] duration-150 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className={`flex h-14 items-center ${collapsed ? "justify-center" : "justify-between px-4"}`}>
        <Link href="/" className="flex items-center" aria-label="DefoLoop home">
          <Logo collapsed={collapsed} />
        </Link>
        {!collapsed && (
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-faint hover:bg-sidebar-hover hover:text-text"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-2" : "px-3"}`} aria-label="Main">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} collapsed={collapsed} />
        ))}
      </nav>
      {collapsed && (
        <button
          onClick={toggle}
          className="mx-auto mt-auto mb-3 rounded-md p-1.5 text-faint hover:bg-sidebar-hover hover:text-text"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={16} strokeWidth={1.75} />
        </button>
      )}
    </aside>
  );
}
