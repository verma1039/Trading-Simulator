import { motion } from "framer-motion";

const MotionSpan = motion.span;

export default function AnimatedNumber({
  format = (value) => Math.round(value).toLocaleString("en-US"),
  value,
}) {
  const displayValue = format(value);

  return (
    <MotionSpan
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0.68, y: 4 }}
      key={displayValue}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {displayValue}
    </MotionSpan>
  );
}
