"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import type { IDXCarbonMonthly } from "@/types";

interface IDXLineChartProps {
  data: IDXCarbonMonthly[];
}

const USD_PER_IDR = 1 / 16000;

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as IDXCarbonMonthly & { price_usd: number };
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-2xl text-sm min-w-[180px]">
      <p className="font-semibold text-white mb-2">{formatMonth(label)}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Price (IDR)</span>
          <span className="text-emerald-400 font-mono font-bold text-xs">
            Rp {d.avg_price_idr.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Price (USD)</span>
          <span className="text-emerald-300 font-mono text-xs">
            ~${d.price_usd.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Volume</span>
          <span className="text-slate-300 font-mono text-xs">
            {d.volume_tco2e.toLocaleString()} tCO₂e
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Transactions</span>
          <span className="text-slate-300 font-mono text-xs">{d.transactions}</span>
        </div>
      </div>
    </div>
  );
}

export default function IDXLineChart({ data }: IDXLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    price_usd: parseFloat((d.avg_price_idr * USD_PER_IDR).toFixed(2)),
  }));

  const avg =
    chartData.reduce((sum, d) => sum + d.price_usd, 0) / chartData.length;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="idxGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={54}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(16,185,129,0.3)", strokeWidth: 1, strokeDasharray: "4 2" }} />
        <ReferenceLine
          y={avg}
          stroke="rgba(16,185,129,0.4)"
          strokeDasharray="5 3"
          label={{
            value: `Avg $${avg.toFixed(2)}`,
            fill: "#6ee7b7",
            fontSize: 10,
            position: "insideTopRight",
          }}
        />
        <Area
          type="monotone"
          dataKey="price_usd"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#idxGradient)"
          dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#34d399", stroke: "#064e3b", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
