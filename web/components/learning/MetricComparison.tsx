import type { MetricComparison as Metric } from "@/lib/api/types";

const fmt = (v: number) => `${(v * 100).toFixed(1)}%`;

export function MetricComparison({ metric }: { metric: Metric }) {
  const delta = metric.adapted.value - metric.baseline.value;
  const better = metric.higher_is_better ? delta > 0 : delta < 0;
  const tone = delta === 0 ? "text-muted" : better ? "text-[var(--ok)]" : "text-pred";
  const bar = (v: number, cls: string) => (
    <span className="block h-1.5 rounded-full bg-surface-2">
      <span className={`block h-full rounded-full ${cls}`} style={{ width: `${Math.min(100, v * 100)}%` }} />
    </span>
  );

  return (
    <div className="grid grid-cols-[160px_1fr_1fr_110px] items-center gap-6 border-b border-border px-4 py-3 last:border-0">
      <div>
        <p className="text-[13px] font-medium">{metric.label}</p>
        <p className="text-[11px] text-muted">{metric.higher_is_better ? "Higher is better" : "Lower is better"}</p>
      </div>
      {[metric.baseline, metric.adapted].map((m, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold tabular-nums">{fmt(m.value)}</span>
            <span className="font-mono text-[11px] text-muted">
              {m.numerator}/{m.denominator}
            </span>
          </div>
          {bar(m.value, i === 0 ? "bg-faint" : "bg-accent")}
        </div>
      ))}
      <div className={`text-right tabular-nums ${tone}`}>
        <p className="text-[14px] font-semibold">
          {delta > 0 ? "+" : ""}
          {(delta * 100).toFixed(1)} pp
        </p>
        {metric.delta_ci && (
          <p className="font-mono text-[10.5px] text-muted">
            95% CI [{(metric.delta_ci[0] * 100).toFixed(1)}, {(metric.delta_ci[1] * 100).toFixed(1)}]
          </p>
        )}
      </div>
    </div>
  );
}
