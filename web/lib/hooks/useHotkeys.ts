import { useEffect, useRef } from "react";

/**
 * Keys are matched against e.key (case-insensitive). Prefix with "mod+" for
 * ⌘/Ctrl and "shift+" for Shift, e.g. "mod+shift+z". Ignored while typing.
 */
export function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>, enabled = true) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) {
        if (!(t instanceof HTMLInputElement && t.type === "range")) return;
      }
      const combo = [
        e.metaKey || e.ctrlKey ? "mod" : "",
        e.shiftKey && e.key.length > 1 ? "shift" : "",
        e.shiftKey && /^[a-z]$/i.test(e.key) ? "shift" : "",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");
      const handler = ref.current[combo];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
