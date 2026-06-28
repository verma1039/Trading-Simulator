import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const MotionDiv = motion.div;
const MotionSpan = motion.span;
const widths = ["96%", "80%", "64%"];

export default function LoadingState({ className, label = "Preparing market view" }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-slate-950/50 p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <MotionSpan
          animate={{ opacity: [0.4, 1, 0.4] }}
          className="h-2 w-2 rounded-full bg-emerald-300"
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="space-y-3">
        {widths.map((width, index) => (
          <MotionDiv
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            className="h-3 rounded-full bg-white/10"
            key={width}
            style={{ width }}
            transition={{ delay: index * 0.12, duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
