import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const STYLES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent/90 border-transparent",
  secondary: "bg-surface text-text border-border hover:bg-surface-2",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-text",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-40 ${STYLES[variant]} ${className}`}
    />
  );
}

export function IconButton({
  label,
  active,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      {...props}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-35 ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
      } ${className}`}
    />
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-2 px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}
