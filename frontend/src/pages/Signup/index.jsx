import { useMemo, useState } from "react";
import { CalendarDays, Mail, Phone, UserPlus, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";

import AuthPanelDetails from "@/components/auth/AuthPanelDetails";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/context/useToast";

const MotionDiv = motion.div;
const MotionP = motion.p;

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({
    confirmPassword: "",
    dateOfBirth: "",
    email: "",
    name: "",
    password: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => validateSignup(form), [form]);
  const isFormValid = Object.keys(validation).length === 0;

  function updateField(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setErrors(validateSignup(nextForm));
    setSubmitError("");
  }

  async function handleSignup(event) {
    event.preventDefault();
    const nextErrors = validateSignup(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        dateOfBirth: form.dateOfBirth,
        email: form.email,
        name: form.name,
        password: form.password,
        phoneNumber: form.phoneNumber,
      });
      notify({
        description: "Your account is ready. Log in with the credentials you just created.",
        title: "Signup successful",
        variant: "success",
      });
      navigate("/login", { replace: true, state: { email: form.email.trim() } });
    } catch (requestError) {
      setSubmitError(requestError.message);
      notify({
        description: requestError.message,
        title: "Signup failed",
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
        <MotionDiv variants={itemVariant}>
          <div className="mb-5 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300 ring-1 ring-emerald-500/20">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">User Access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Create your account</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter all required profile details once. After signup, log in and go directly to the trading dashboard.
          </p>
        </MotionDiv>

        <MotionDiv className="space-y-4" variants={itemVariant}>
          <form className="space-y-4" onSubmit={handleSignup}>
            <Field
              error={errors.name}
              icon={UserRound}
              label="Full Name"
              onChange={(value) => updateField("name", value)}
              placeholder="Full name"
              value={form.name}
            />
            <Field
              error={errors.email}
              icon={Mail}
              label="Email"
              onChange={(value) => updateField("email", value)}
              placeholder="Email"
              type="email"
              value={form.email}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                error={errors.password}
                label="Password"
                onChange={(value) => updateField("password", value)}
                type="password"
                value={form.password}
              />
              <Field
                error={errors.confirmPassword}
                label="Confirm Password"
                onChange={(value) => updateField("confirmPassword", value)}
                type="password"
                value={form.confirmPassword}
              />
            </div>
            <Field
              error={errors.phoneNumber}
              icon={Phone}
              inputMode="numeric"
              label="Mobile Number"
              onChange={(value) => updateField("phoneNumber", value)}
              placeholder="Mobile number"
              value={form.phoneNumber}
            />
            <Field
              error={errors.dateOfBirth}
              icon={CalendarDays}
              label="Date Of Birth"
              onChange={(value) => updateField("dateOfBirth", value)}
              type="date"
              value={form.dateOfBirth}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">
              Mobile number must contain 10-15 digits. Date of birth is required and remains locked after signup.
            </div>

            {submitError ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{submitError}</p> : null}
            <Button className="w-full shadow-lg shadow-emerald-500/10" disabled={isSubmitting || !isFormValid} size="lg" type="submit">
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </MotionDiv>

        <MotionP className="text-center text-sm text-muted-foreground" variants={itemVariant}>
          Already have an account?{" "}
          <NavLink className="font-semibold text-emerald-300 hover:text-emerald-200" to="/login">
            Login
          </NavLink>
        </MotionP>

        <AuthPanelDetails />
      </MotionDiv>
    </AuthShell>
  );
}

function Field({ error, icon: Icon, label, onChange, type = "text", value, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : null}
        {label}
      </span>
      <Input
        aria-invalid={Boolean(error)}
        className="h-12 bg-slate-950/80"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function validateSignup(form) {
  const errors = {};
  const phoneDigits = form.phoneNumber.replace(/\D/g, "");

  if (form.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords must match.";
  }

  if (!/^\d{10,15}$/.test(phoneDigits)) {
    errors.phoneNumber = "Mobile number must contain 10 to 15 digits.";
  }

  if (!form.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else if (!isAdult(form.dateOfBirth)) {
    errors.dateOfBirth = "You must be at least 18 years old.";
  }

  return errors;
}

function isAdult(value) {
  const birthDate = new Date(value + "T00:00:00");
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
