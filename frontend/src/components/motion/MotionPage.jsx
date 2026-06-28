import { motion } from "framer-motion";

const MotionDiv = motion.div;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export function MotionPage({ children, className }) {
  return (
    <MotionDiv
      animate="visible"
      className={className}
      initial="hidden"
      variants={containerVariants}
    >
      {children}
    </MotionDiv>
  );
}

export function MotionItem({ children, className }) {
  return (
    <MotionDiv className={className} variants={itemVariants}>
      {children}
    </MotionDiv>
  );
}
