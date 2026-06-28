import { Inbox } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

export default function EmptyState({ className, description = "Data will appear here.", title = "No rows" }) {
  return (
    <MotionDiv
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center", className)}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-muted-foreground">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </MotionDiv>
  );
}
