import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const MotionSection = motion.section;

export function Card({ children, className }) {
  return (
    <MotionSection
      className={cn(
        "group rounded-xl border border-white/10 bg-card/80 text-card-foreground shadow-sm shadow-black/20 transition-colors duration-300 hover:border-white/15 hover:bg-card/90",
        className,
      )}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      {children}
    </MotionSection>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("border-b border-white/10 p-5", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h2 className={cn("text-base font-semibold tracking-tight", className)}>{children}</h2>;
}

export function CardDescription({ children, className }) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
