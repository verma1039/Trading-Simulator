import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const MotionTr = motion.tr;

export default function DataTable({ columns, emptyState, rows }) {
  if (!rows.length) {
    return emptyState;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-950/90 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th className={cn("px-4 py-3 font-semibold", column.className)} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, index) => (
              <MotionTr
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/40 transition hover:bg-slate-900/80"
                initial={{ opacity: 0, y: 8 }}
                key={row.id || row.symbol || row.email}
                transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
              >
                {columns.map((column) => (
                  <td className={cn("px-4 py-3 align-middle", column.className)} key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </MotionTr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
