import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatPercent } from "@/lib/formatters";

export default function AllocationPieChart({ animated = true, data }) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
            color: "#e2e8f0",
          }}
          formatter={(value) => formatPercent(value)}
        />
        <Pie animationDuration={900} data={data} dataKey="value" innerRadius={64} isAnimationActive={animated} nameKey="label" outerRadius={96} paddingAngle={3}>
          {data.map((entry) => (
            <Cell fill={entry.color} key={entry.label} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
