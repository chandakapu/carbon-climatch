"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { CarbonPrice } from "@/types";

interface PriceBarChartProps {
  data: { jurisdiction: string; price_usd: number; instrument_name: string }[];
}

const COLORS: Record<string, string> = {
  Indonesia: "#0CF2A0",   // neon green — home market
  "EU27+": "#3b82f6",     // blue — EU ETS (CBAM reference)
  Singapore: "#a78bfa",   // violet
  "Korea, Rep.": "#f59e0b", // amber
};

const DISPLAY_NAMES: Record<string, string> = {
  Indonesia: "Indonesia",
  "EU27+": "EU ETS",
  Singapore: "Singapore",
  "Korea, Rep.": "South Korea",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { jurisdiction: string; price_usd: number; instrument_name: string };
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur px-4 py-3 shadow-2xl text-sm">
      <p className="font-semibold text-white">{DISPLAY_NAMES[d.jurisdiction] ?? d.jurisdiction}</p>
      <p className="text-slate-400 text-xs mt-0.5">{d.instrument_name}</p>
      <p className="text-[#0CF2A0] font-bold mt-1 text-base">
        ${d.price_usd.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ tCO₂e</span>
      </p>
    </div>
  );
}

export default function PriceBarChart({ data }: PriceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        barCategoryGap="35%"
      >
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="jurisdiction"
          tickFormatter={(v: string) => DISPLAY_NAMES[v] ?? v}
          tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
        <Bar dataKey="price_usd" radius={[6, 6, 0, 0]} maxBarSize={80}>
          {data.map((entry) => (
            <Cell
              key={entry.jurisdiction}
              fill={COLORS[entry.jurisdiction] ?? "#64748b"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Also export for use elsewhere
export type { CarbonPrice };
