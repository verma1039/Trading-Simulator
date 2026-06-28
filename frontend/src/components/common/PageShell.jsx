import { MotionItem, MotionPage } from "@/components/motion/MotionPage";

export default function PageShell({ actions, children, eyebrow, subtitle, title }) {
  return (
    <MotionPage className="space-y-6">
      <MotionItem className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </MotionItem>
      <MotionItem className="space-y-6">{children}</MotionItem>
    </MotionPage>
  );
}
