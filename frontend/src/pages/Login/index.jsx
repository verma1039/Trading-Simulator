import { createElement } from "react";
import { useState } from "react";
import { CandlestickChart } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import AuthPanelDetails from "@/components/auth/AuthPanelDetails";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/context/useToast";
import { formatCurrency } from "@/lib/formatters";

const MotionDiv = motion.div;
const MotionP = motion.p;

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login(form);
      const isAdmin = session.role === "ADMIN";
      const bonusAmount = Number(session.joiningBonusAmount || 0);
      notify({
        description: session.joiningBonusCredited
          ? session.joiningBonusMessage || formatCurrency(bonusAmount) + " has been added to your paper trading cash balance."
          : isAdmin
            ? "Admin session active."
            : "User session active.",
        title: session.joiningBonusCredited ? "Joining bonus credited" : "Login successful",
        variant: "success",
      });
      navigate(isAdmin ? "/admin" : "/user");
    } catch (requestError) {
      setError(requestError.message);
      notify({
        description: requestError.message,
        title: "Login failed",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <MotionDiv
        animate="visible"
        className="space-y-6"
        initial="hidden"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
      >
        <AuthHeader
          eyebrow="Account Access"
          icon={CandlestickChart}
          title="Welcome back"
          subtitle="Sign in to access your trading workspace."
        />

        <MotionDiv className="space-y-4" variants={itemVariant}>
          <form className="space-y-4" onSubmit={handleLogin}>
            <Field
              label="Email"
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              value={form.email}
            />
            <Field
              label="Password"
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
              type="password"
              value={form.password}
            />
            {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
            <Button className="w-full shadow-lg shadow-emerald-500/10" disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </MotionDiv>

        <MotionP className="text-center text-sm text-muted-foreground" variants={itemVariant}>
          New here?{" "}
          <NavLink className="font-semibold text-emerald-300 hover:text-emerald-200" to="/signup">
            Create account
          </NavLink>
        </MotionP>

        <AuthPanelDetails />
      </MotionDiv>
    </AuthShell>
  );
}

function AuthHeader({ eyebrow, icon, subtitle, title }) {
  return (
    <MotionDiv variants={itemVariant}>
      <div className="mb-5 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300 ring-1 ring-emerald-500/20">
        {createElement(icon, { className: "h-6 w-6", "aria-hidden": "true" })}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
    </MotionDiv>
  );
}

function Field({ label, onChange, type = "text", value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input className="h-12 bg-slate-950/80" onChange={(event) => onChange(event.target.value)} required type={type} value={value} />
    </label>
  );
}

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
