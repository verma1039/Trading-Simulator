import { useEffect, useState } from "react";
import { Clock3, Globe2, MapPin, Save, UserRound } from "lucide-react";

import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import PageShell from "@/components/common/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/context/useToast";
import { getProfile, updateProfile } from "@/services/profileService";

export default function SettingsPage() {
  const { refreshSession, session } = useAuth();
  const { notify } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    country: "India",
    displayName: "",
    phoneNumber: "",
    timezone: "Asia/Kolkata",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await getProfile();
        if (!isMounted) {
          return;
        }
        setProfile(payload.profile);
        setForm({
          country: payload.profile.country || "India",
          displayName: payload.profile.name || "",
          phoneNumber: payload.profile.phoneNumber || "",
          timezone: payload.profile.timezone || "Asia/Kolkata",
        });
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();

    setIsSaving(true);
    setError("");

    try {
      const payload = await updateProfile({
        country: form.country.trim(),
        displayName: form.displayName.trim(),
        phoneNumber: form.phoneNumber.replace(/\D/g, ""),
        timezone: form.timezone.trim(),
      });
      setProfile(payload.profile);
      setForm({
        country: payload.profile.country || "India",
        displayName: payload.profile.name || "",
        phoneNumber: payload.profile.phoneNumber || "",
        timezone: payload.profile.timezone || "Asia/Kolkata",
      });
      await refreshSession();
      notify({
        description: "Your profile preferences were updated.",
        title: "Profile saved",
        variant: "success",
      });
    } catch (requestError) {
      setError(requestError.message);
      notify({
        description: requestError.message,
        title: "Profile update failed",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading profile settings" />;
  }

  if (error && !profile) {
    return <ErrorState message={error} title="Settings unavailable" />;
  }

  const currentProfile = profile || session;
  const loginBadge = currentProfile.loginBadge;

  return (
    <PageShell
      eyebrow="Settings"
      subtitle="Manage profile details and account preferences."
      title="Account settings"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Profile Information
            </CardTitle>
            <CardDescription>Name, mobile number, country, and timezone can be edited. Email and date of birth are locked.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave}>
              <div className="grid gap-4 md:grid-cols-2">
                <EditableField
                  label="Name"
                  onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
                  value={form.displayName}
                />
                <Field label="Email" value={currentProfile.email} />
                <EditableField
                  label="Phone Number"
                  onChange={(value) => setForm((current) => ({ ...current, phoneNumber: value }))}
                  value={form.phoneNumber}
                />
                <Field label="Date Of Birth" value={currentProfile.dateOfBirth || "Not provided"} />
                <EditableField
                  icon={MapPin}
                  label="Country"
                  onChange={(value) => setForm((current) => ({ ...current, country: value }))}
                  value={form.country}
                />
                <EditableField
                  icon={Globe2}
                  label="Timezone"
                  onChange={(value) => setForm((current) => ({ ...current, timezone: value }))}
                  value={form.timezone}
                />
              </div>
              {error ? (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
              ) : null}
              <Button className="mt-5" disabled={isSaving} type="submit" variant="outline">
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                Account Metadata
              </CardTitle>
              <CardDescription>Role, status, and login details are managed by account policy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetaRow label="Role" value={currentProfile.role} />
              <MetaRow label="Status" value={currentProfile.status} />
              <MetaRow label="Created At" value={currentProfile.createdAt || "Not provided"} />
              <MetaRow label="Last Login" value={currentProfile.lastLoginLabel || "Never"} />
              {loginBadge ? <Badge variant={badgeVariant(loginBadge.tone)}>{loginBadge.label}</Badge> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input readOnly value={value || ""} />
    </label>
  );
}

function EditableField({ icon: Icon, label, onChange, value }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : null}
        {label}
      </span>
      <Input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white">{value || "Not provided"}</span>
    </div>
  );
}

function badgeVariant(tone) {
  const variants = {
    info: "info",
    neutral: "neutral",
    positive: "positive",
    warning: "warning",
  };

  return variants[tone] || "neutral";
}
