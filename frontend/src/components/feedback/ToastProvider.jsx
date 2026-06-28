import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import ToastContext from "@/context/toastContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const toastStyles = {
  error: {
    icon: AlertTriangle,
    shell: "border-red-500/25 bg-red-950/90 text-red-50 shadow-red-950/30",
    iconClass: "bg-red-500/15 text-red-200",
  },
  info: {
    icon: Info,
    shell: "border-sky-500/25 bg-slate-950/95 text-sky-50 shadow-sky-950/25",
    iconClass: "bg-sky-500/15 text-sky-200",
  },
  success: {
    icon: CheckCircle2,
    shell: "border-emerald-500/25 bg-slate-950/95 text-emerald-50 shadow-emerald-950/25",
    iconClass: "bg-emerald-500/15 text-emerald-200",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ description = "", title, variant = "info" }) => {
      const id = globalThis.crypto?.randomUUID?.() || "toast-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      setToasts((currentToasts) => [
        ...currentToasts,
        { description, id, title, variant },
      ]);
      window.setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ dismissToast, notify }), [dismissToast, notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} onDismiss={() => dismissToast(toast.id)} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ onDismiss, toast }) {
  const style = toastStyles[toast.variant] || toastStyles.info;
  const Icon = style.icon;

  return (
    <MotionDiv
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn(
        "pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur",
        style.shell,
      )}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      initial={{ opacity: 0, x: 24, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex gap-3">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", style.iconClass)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? <p className="mt-1 text-xs leading-5 text-slate-300">{toast.description}</p> : null}
        </div>
        <Button aria-label="Dismiss notification" onClick={onDismiss} size="xs" type="button" variant="ghost">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </MotionDiv>
  );
}
