import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Search,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import AnimatedNumber from "@/components/motion/AnimatedNumber";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const heroMetrics = [
  { accent: "emerald", formatter: formatNumber, icon: Users, key: "totalUsers", label: "Total Users", meta: "Registered accounts" },
  { accent: "sky", formatter: formatNumber, icon: UserCheck, key: "activeUsers", label: "Active Users", meta: "Verified accounts" },
  { accent: "red", formatter: formatNumber, icon: ShieldAlert, key: "suspendedUsers", label: "Suspended Users", meta: "Needs review" },
  { accent: "amber", formatter: formatNumber, icon: Wallet, key: "pendingDeposits", label: "Pending Deposits", meta: "Awaiting action" },
];

const activityIcons = {
  activated: UserCheck,
  approved: CheckCircle2,
  rejected: XCircle,
  suspended: ShieldAlert,
};

export function AdminHero({ summary }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_78%_12%,rgba(16,185,129,0.14),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-black/25 lg:p-6">
      <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 max-w-[300px] space-y-6 sm:max-w-none">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Operations Console</Badge>
            <Badge variant="positive">Platform Online</Badge>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Admin Control Center</p>
            <h1 className="mt-3 max-w-[300px] break-words text-2xl font-semibold tracking-tight text-white sm:max-w-3xl sm:text-3xl md:text-4xl">
              Monitor users, funding requests, and account risk from one command view.
            </h1>
            <p className="mt-3 max-w-[300px] text-sm leading-6 text-muted-foreground sm:max-w-2xl">
              Review pending actions, spot problem accounts, and manage virtual funding workflows using platform records.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {heroMetrics.map((metric) => (
              <HeroMetric key={metric.key} metric={metric} summary={summary} />
            ))}
          </div>
        </div>

        <Card className="min-w-0 max-w-[300px] rounded-[1.5rem] border-sky-400/20 bg-slate-950/45 sm:max-w-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Platform Health</p>
                <h2 className="mt-3 text-4xl font-semibold text-white">
                  <AnimatedNumber format={(value) => value.toFixed(1) + "%"} value={summary.platformHealth} />
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Operational status</p>
              </div>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-300/40" />
                <Gauge className="relative h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: summary.platformHealth + "%" }} />
            </div>

            <div className="mt-6 grid gap-3">
              <HealthStat icon={Clock3} label="Pending Actions" tone="warning" value={summary.pendingActions} />
              <HealthStat icon={AlertTriangle} label="Attention Required" tone="negative" value={summary.attentionRequired} />
              <HealthStat icon={ShieldCheck} label="Reviewed Today" tone="positive" value={summary.reviewedToday} />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function OperationsOverview({ operations }) {
  return (
    <section className="space-y-4">
      <WidgetHeading
        eyebrow="Operations Overview"
        icon={Activity}
        subtitle="High-signal operational metrics for this admin session."
        title="Platform pulse"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {operations.map((operation, index) => (
          <MotionDiv
            className="rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm shadow-black/20 transition-colors hover:border-sky-400/25 hover:bg-card"
            initial={{ opacity: 0, y: 14 }}
            key={operation.id}
            transition={{ delay: index * 0.035, duration: 0.35 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01, y: -3 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{operation.label}</p>
            <p className="mt-3 text-2xl font-semibold">
              <AnimatedNumber
                format={operation.type === "currency" ? formatCompactCurrency : formatNumber}
                value={operation.value}
              />
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <TrendPill value={operation.trend} />
              <span className="truncate text-xs text-muted-foreground">{operation.meta}</span>
            </div>
          </MotionDiv>
        ))}
      </div>
    </section>
  );
}

export function DepositApprovalQueue({ deposits, onApprove, onReject, onSelectUser, pendingAction, selectedUserId }) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-amber-400/15">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
          <WidgetHeading
            eyebrow="Primary Queue"
            icon={CircleDollarSign}
            subtitle="Approve and reject actions update the deposit queue."
            title="Deposit approval queue"
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">{deposits.filter((deposit) => deposit.status === "PENDING").length} Pending</Badge>
            <Badge variant="neutral">Admin Actions</Badge>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="hidden rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid xl:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_minmax(120px,1fr)_auto] xl:items-center xl:gap-4">
            <span>User</span>
            <span className="text-right">Amount</span>
            <span>Request Time</span>
            <span>Status</span>
            <span>Notes</span>
            <span className="text-right">Actions</span>
          </div>
          {deposits.length ? (
            deposits.map((deposit, index) => (
              <DepositRow
                deposit={deposit}
                index={index}
                isSelected={selectedUserId === deposit.userId}
                key={deposit.id}
                onApprove={onApprove}
                onReject={onReject}
                onSelectUser={onSelectUser}
                pendingAction={pendingAction}
              />
            ))
          ) : (
            <EmptyState
              description="New deposit requests will appear here when users submit funding requests."
              title="No deposit requests"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserManagementCenter({
  onActivate,
  onSearchChange,
  onSelectUser,
  onSuspend,
  pendingAction,
  searchQuery = "",
  selectedUserId,
  totalUsers,
  users,
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
          <WidgetHeading
            eyebrow="User Management"
            icon={UserCog}
            subtitle="Inspect account health, portfolio size, and account controls."
            title="User management center"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search admin users"
                className="pl-9"
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Search user, email, phone, status"
                value={searchQuery}
              />
            </div>
            {searchQuery ? (
              <Button onClick={() => onSearchChange?.("")} size="xs" type="button" variant="outline">
                Clear
              </Button>
            ) : null}
            <Badge variant="positive">
              {formatNumber(users.length)} / {formatNumber(totalUsers ?? users.length)} Visible Users
            </Badge>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="hidden rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid xl:grid-cols-[1.1fr_1.1fr_0.7fr_0.9fr_0.8fr_auto] xl:items-center xl:gap-4">
            <span>User</span>
            <span>Email</span>
            <span>Status</span>
            <span className="text-right">Portfolio Value</span>
            <span>Last Active</span>
            <span className="text-right">Actions</span>
          </div>
          {users.length ? (
            users.map((user, index) => (
              <UserRow
                index={index}
                isSelected={selectedUserId === user.id}
                key={user.id}
                onActivate={onActivate}
                onSelectUser={onSelectUser}
                onSuspend={onSuspend}
                pendingAction={pendingAction}
                user={user}
              />
            ))
          ) : (
            <EmptyState
              description={searchQuery ? "No users match the current search. Try name, email, phone, role, or status." : "Signed-up users will appear here once accounts exist."}
              title={searchQuery ? "No matching users" : "No users available"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UserDetailPanel({ user }) {
  if (!user) {
    return (
      <Card className="rounded-[1.5rem]">
        <CardContent>
          <WidgetHeading
            eyebrow="User Detail"
            icon={Eye}
            subtitle="Select a user to inspect account context."
            title="User detail panel"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-sky-400/20 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),rgba(15,23,42,0.86)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">User Detail</p>
            <h2 className="mt-3 text-3xl font-semibold">{user.name}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={user.status} />
            <LoginActivityBadge badge={user.loginBadge} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Portfolio Value</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(user.portfolioValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Risk Level</p>
              <p className={cn("mt-2 text-lg font-semibold", riskClass(user.riskLevel))}>{user.riskLevel}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailMetric label="Phone Number" value={emptyValue(user.phoneNumber)} />
          <DetailMetric label="Date of Birth" value={emptyValue(user.dateOfBirth)} />
          <DetailMetric label="Timezone" value={emptyValue(user.timezone)} />
          <DetailMetric label="Country" value={emptyValue(user.country)} />
          <DetailMetric label="Role" value={emptyValue(user.role)} />
          <DetailMetric label="Status" value={emptyValue(user.status)} />
          <DetailMetric label="Created At" value={emptyValue(user.createdAt)} />
          <DetailMetric label="Last Login" value={emptyValue(user.lastLoginLabel)} />
          <DetailMetric label="Holdings Count" value={formatNumber(user.holdingsCount)} />
          <DetailMetric label="Last Active" value={user.lastActive} />
          <DetailMetric label="Account Age" value={user.accountAge} />
          <DetailMetric label="Deposit Count" value={formatNumber(user.deposits.length)} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <MiniList
            items={user.deposits.map((deposit) => ({
              id: deposit.id,
              label: formatCurrency(deposit.amount),
              meta: deposit.date,
              status: deposit.status,
            }))}
            title="Deposit History"
          />
          <MiniList
            items={user.activity.map((activity) => ({
              id: activity.id,
              label: activity.label,
              meta: activity.time,
            }))}
            title="Recent Activity"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function UserDetailDrawer({ onClose, user }) {
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <MotionDiv
        animate={{ opacity: 1, x: 0 }}
        className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/50"
        initial={{ opacity: 0, x: 32 }}
        onClick={(event) => event.stopPropagation()}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">User Detail Drawer</p>
            <p className="mt-1 text-sm text-muted-foreground">Admin account inspection panel</p>
          </div>
          <Button aria-label="Close user detail drawer" onClick={onClose} size="xs" type="button" variant="outline">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <UserDetailPanel user={user} />
        </div>
      </MotionDiv>
    </div>
  );
}

export function AdminActivityTimeline({ activity }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Admin Activity"
          icon={Clock3}
          subtitle="Recent operational actions in timeline form."
          title="Operations timeline"
        />

        <div className="mt-6 space-y-1">
          {activity.length ? (
            activity.map((item, index) => (
              <TimelineItem index={index} item={item} key={item.id} />
            ))
          ) : (
            <EmptyState
              description="Admin approvals and user-status changes will appear here."
              title="No admin activity yet"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskAttentionWidgets({ attention, onSelectUser }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Risk & Attention"
          icon={AlertTriangle}
          subtitle="Compact lists for accounts and funding requests that need admin focus."
          title="Attention board"
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-3 xl:grid-cols-1">
          <AttentionGroup
            emptyLabel="No suspended accounts"
            icon={ShieldAlert}
            items={attention.suspendedAccounts}
            onSelectUser={onSelectUser}
            title="Suspended Accounts"
            type="user"
          />
          <AttentionGroup
            emptyLabel="No large requests"
            icon={Wallet}
            items={attention.largeDeposits}
            title="Large Deposit Requests"
            type="deposit"
          />
          <AttentionGroup
            emptyLabel="No recent activity"
            icon={Activity}
            items={attention.recentlyActiveUsers}
            onSelectUser={onSelectUser}
            title="Recently Active Users"
            type="user"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({ metric, summary }) {
  const value = summary[metric.key];

  return (
    <MotionDiv
      className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/45 p-4"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
        <span className={cn("rounded-xl p-2", accentClass(metric.accent))}>
          {createElement(metric.icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">
        <AnimatedNumber format={metric.formatter} value={value} />
      </p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{metric.meta}</p>
    </MotionDiv>
  );
}

function HealthStat({ icon, label, tone, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("rounded-xl p-2", toneClass(tone))}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="truncate text-sm font-semibold">{label}</p>
      </div>
      <p className="text-lg font-semibold">{formatNumber(value)}</p>
    </div>
  );
}

function DepositRow({ deposit, index, isSelected, onApprove, onReject, onSelectUser, pendingAction }) {
  const isPending = deposit.status === "PENDING";
  const isApproving = pendingAction?.type === "approve-deposit" && pendingAction.id === deposit.id;
  const isRejecting = pendingAction?.type === "reject-deposit" && pendingAction.id === deposit.id;
  const isBusy = isApproving || isRejecting;

  return (
    <MotionDiv
      className={cn(
        "grid cursor-pointer gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-sky-400/25 hover:bg-slate-900/80 xl:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_minmax(120px,1fr)_auto] xl:items-center",
        isSelected && "border-sky-400/25 bg-sky-500/[0.07]",
      )}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelectUser(deposit.userId)}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div>
        <button className="text-left" onClick={() => onSelectUser(deposit.userId)} type="button">
          <p className="font-semibold text-white">{deposit.user}</p>
          <p className="text-xs text-muted-foreground">{deposit.date}</p>
        </button>
      </div>
      <div className="font-semibold xl:text-right">{formatCurrency(deposit.amount)}</div>
      <div className="text-sm text-muted-foreground">{deposit.requestTime}</div>
      <div>
        <StatusBadge status={deposit.status} />
      </div>
      <div className="text-sm leading-5 text-muted-foreground">{deposit.notes}</div>
      <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
          <Button
            disabled={!isPending || isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onApprove?.(deposit.id);
            }}
            size="xs"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
          <Button
            disabled={!isPending || isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onReject?.(deposit.id);
            }}
            size="xs"
            variant="danger"
          >
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
      </div>
    </MotionDiv>
  );
}

function UserRow({ index, isSelected, onActivate, onSelectUser, onSuspend, pendingAction, user }) {
  const isActivating = pendingAction?.type === "activate-user" && pendingAction.id === user.id;
  const isSuspending = pendingAction?.type === "suspend-user" && pendingAction.id === user.id;
  const isBusy = isActivating || isSuspending;

  return (
    <MotionDiv
      className={cn(
        "grid cursor-pointer gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-sky-400/25 hover:bg-slate-900/80 xl:grid-cols-[1.1fr_1.1fr_0.7fr_0.9fr_0.8fr_auto] xl:items-center",
        isSelected && "border-sky-400/25 bg-sky-500/[0.07]",
      )}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelectUser(user.id)}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/65 text-sm font-semibold text-sky-300">
            {initials(user.name)}
          </span>
          <div>
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.riskLevel} risk</p>
          </div>
        </div>
      </div>
      <div className="truncate text-sm text-muted-foreground">{user.email}</div>
      <div>
        <StatusBadge status={user.status} />
      </div>
      <div className="font-semibold xl:text-right">{formatCurrency(user.portfolioValue)}</div>
      <div className="text-sm text-muted-foreground">{user.lastActive}</div>
      <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onSelectUser(user.id);
            }}
            size="xs"
            variant="outline"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            View
          </Button>
          {user.status === "SUSPENDED" ? (
            <Button
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onActivate?.(user.id);
              }}
              size="xs"
              variant="outline"
            >
              {isActivating ? "Activating..." : "Activate"}
            </Button>
          ) : (
            <Button
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onSuspend?.(user.id);
              }}
              size="xs"
              variant="danger"
            >
              {isSuspending ? "Suspending..." : "Suspend"}
            </Button>
          )}
      </div>
    </MotionDiv>
  );
}

function TimelineItem({ index, item }) {
  const Icon = activityIcons[item.type] || Activity;

  return (
    <MotionDiv
      className="relative pl-10"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.35 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="absolute left-4 top-10 h-full w-px bg-white/10" aria-hidden="true" />
      <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-sky-300">
        {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
      </span>
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-colors hover:border-sky-400/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
        </div>
      </div>
    </MotionDiv>
  );
}

function AttentionGroup({ emptyLabel, icon, items, onSelectUser, title, type }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((item) => (
          <AttentionItem item={item} key={item.id} onSelectUser={onSelectUser} type={type} />
        )) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function AttentionItem({ item, onSelectUser, type }) {
  if (type === "deposit") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{item.user}</p>
          <p className="text-sm font-semibold text-amber-300">{formatCompactCurrency(item.amount)}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{item.requestTime} · {item.status}</p>
      </div>
    );
  }

  return (
    <button
      className="w-full rounded-xl border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-sky-400/25"
      onClick={() => onSelectUser?.(item.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{item.name}</p>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{item.lastActive} · {formatCompactCurrency(item.portfolioValue)}</p>
    </button>
  );
}

function MiniList({ items, title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2" key={item.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.meta}</p>
            </div>
            {item.status ? <StatusBadge status={item.status} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function emptyValue(value) {
  return value || "Not provided";
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();
  const variantMap = {
    active: "active",
    approved: "approved",
    pending: "pending",
    rejected: "rejected",
    suspended: "suspended",
  };

  return <Badge variant={variantMap[normalized] || "neutral"}>{status}</Badge>;
}

function LoginActivityBadge({ badge }) {
  if (!badge) {
    return <Badge variant="neutral">Never Logged In</Badge>;
  }

  const variantMap = {
    info: "info",
    neutral: "neutral",
    positive: "positive",
    warning: "warning",
  };

  return <Badge variant={variantMap[badge.tone] || "neutral"}>{badge.label}</Badge>;
}

function TrendPill({ value }) {
  const positive = value.startsWith("+");
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold", positive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300")}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {value}
    </span>
  );
}

function WidgetHeading({ eyebrow, icon, subtitle, title }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{eyebrow}</p>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function accentClass(accent) {
  const accents = {
    amber: "bg-amber-500/10 text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    red: "bg-red-500/10 text-red-300",
    sky: "bg-sky-500/10 text-sky-300",
  };

  return accents[accent] || accents.sky;
}

function toneClass(tone) {
  const tones = {
    negative: "bg-red-500/10 text-red-300",
    positive: "bg-emerald-500/10 text-emerald-300",
    warning: "bg-amber-500/10 text-amber-300",
  };

  return tones[tone] || tones.positive;
}

function riskClass(riskLevel) {
  const classes = {
    High: "text-red-300",
    Low: "text-emerald-300",
    Medium: "text-amber-300",
  };

  return classes[riskLevel] || "text-sky-300";
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
