import { motion } from "framer-motion";

import AuthShowcase from "@/components/auth/AuthShowcase";

const MotionSection = motion.section;

export default function AuthShell({ children, mode = "user" }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-5 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-12 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-[calc(100vw-2rem)] min-w-0 gap-6 xl:max-w-[1500px] xl:grid-cols-[1.15fr_0.85fr]">
        <AuthShowcase mode={mode} />
        <MotionSection
          animate={{ opacity: 1, x: 0 }}
          className="flex w-full max-w-[calc(100vw-2rem)] min-w-0 items-start justify-center rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 pt-14 shadow-2xl shadow-black/30 backdrop-blur-xl sm:pt-16 lg:p-8 lg:pt-24 xl:max-w-full"
          initial={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-full max-w-md min-w-0">{children}</div>
        </MotionSection>
      </div>
    </div>
  );
}
