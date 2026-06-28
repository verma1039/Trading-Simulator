import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCompactCurrency } from "@/lib/formatters";

export default function PortfolioGrowthChart({ animated = true, data }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 8, top: 10 }}>
        <defs>
          <linearGradient id="portfolioValue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="portfolioInvested" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
        <XAxis axisLine={false} dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} />
        <YAxis axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={formatCompactCurrency} tickLine={false} width={72} />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            color: "#e2e8f0",
          }}
          formatter={(value) => formatCompactCurrency(value)}
        />
        <Area animationDuration={900} dataKey="invested" fill="url(#portfolioInvested)" isAnimationActive={animated} name="Invested" stroke="#38bdf8" strokeWidth={2} type="monotone" />
        <Area animationDuration={1100} dataKey="value" fill="url(#portfolioValue)" isAnimationActive={animated} name="Value" stroke="#10b981" strokeWidth={2.5} type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
