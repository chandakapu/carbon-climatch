"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { CBAMPortfolioResult } from "@/types";

interface CBAMPortfolioChartsProps {
  portfolioResult: CBAMPortfolioResult;
}

const COLORS = [
  "#3b82f6", // blue
  "#0CF2A0", // neon green
  "#a78bfa", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { sector: string; export_volume_tons: number; cbam_liability_usd: number; indonesia_carbon_credit_usd: number; net_liability_usd: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/5 bg-[#1a1a1a] backdrop-blur px-4 py-3 shadow-2xl text-sm">
      <p className="font-semibold text-white">{d.sector}</p>
      <p className="text-slate-400 text-xs mt-0.5">Export Volume: {d.export_volume_tons?.toLocaleString()} tons</p>
      <div className="mt-2 space-y-1">
        <p className="text-blue-400 font-medium">
          Gross Liability: ${d.cbam_liability_usd?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-[#0CF2A0] font-medium">
          Domestic Credit: ${d.indonesia_carbon_credit_usd?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-red-400 font-bold border-t border-white/5 pt-1 mt-1">
          Net Liability: ${d.net_liability_usd?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { sector: string; total_emissions_tco2: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = payload[0].value;
  return (
    <div className="rounded-xl border border-white/5 bg-[#1a1a1a] backdrop-blur px-4 py-3 shadow-2xl text-sm">
      <p className="font-semibold text-white">{d.sector}</p>
      <p className="text-[#0CF2A0] font-bold mt-1">
        {d.total_emissions_tco2?.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
        <span className="text-xs font-normal text-slate-400">tCO₂e ({pct.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

export default function CBAMPortfolioCharts({ portfolioResult }: CBAMPortfolioChartsProps) {
  const { items } = portfolioResult;

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a]/40 py-16 text-center">
        <p className="text-slate-500 text-sm">Add sectors and export volumes above to view visual breakdown.</p>
      </div>
    );
  }

  // Bar Chart Data: Sector breakdown
  const barData = items.map((item) => ({
    sector: item.sector,
    export_volume_tons: item.export_volume_tons,
    cbam_liability_usd: item.cbam_liability_usd,
    indonesia_carbon_credit_usd: item.indonesia_carbon_credit_usd,
    net_liability_usd: item.net_liability_usd,
  }));

  // Pie Chart Data: Emissions contribution
  const totalEmissions = portfolioResult.total_emissions_tco2 || 1;
  const pieData = items.map((item) => ({
    name: item.sector,
    sector: item.sector,
    value: (item.total_emissions_tco2 / totalEmissions) * 100,
    total_emissions_tco2: item.total_emissions_tco2,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Stacked Bar Chart: Financial Breakdown */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 flex flex-col justify-between">
        <div className="mb-5">
          <h3 className="font-semibold text-white text-sm text-balance">Financial Liability Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Credit Offset (paid in Indonesia) vs Net EU CBAM Liability (USD)
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="sector"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString()}`}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ color: "#94a3b8", fontSize: "11px" }}
                iconType="circle"
                iconSize={8}
              />
              {/* Stacked components */}
              <Bar
                dataKey="indonesia_carbon_credit_usd"
                stackId="a"
                fill="#0CF2A0"
                name="Indonesia Credit Offset"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="net_liability_usd"
                stackId="a"
                fill="#f43f5e"
                name="Net EU Liability"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart: Emissions Contribution */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1a] p-6 flex flex-col justify-between">
        <div className="mb-5">
          <h3 className="font-semibold text-white text-sm text-balance">Emissions Contribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Share of total embedded greenhouse gas emissions (tCO₂e)
          </p>
        </div>

        <div className="h-64 w-full relative flex items-center justify-center">
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-xl font-extrabold text-white">
              {portfolioResult.total_emissions_tco2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-slate-400">tCO₂e</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
          {pieData.map((d, index) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-slate-400">{d.name}</span>
              <span className="text-slate-500 font-mono">({d.value.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
