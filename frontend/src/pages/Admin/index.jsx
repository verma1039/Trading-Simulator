import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import {
  AdminActivityTimeline,
  AdminHero,
  DepositApprovalQueue,
  OperationsOverview,
  RiskAttentionWidgets,
  UserDetailDrawer,
  UserDetailPanel,
  UserManagementCenter,
} from "@/components/admin/AdminConsole";
import { MotionItem, MotionPage } from "@/components/motion/MotionPage";
import { useToast } from "@/context/useToast";
import { activateUser, approveDeposit, getAdminDashboard, rejectDeposit, suspendUser } from "@/services/adminService";

export default function AdminPage() {
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const adminSearchQuery = searchParams.get("search") || "";

  const loadAdminDashboard = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const payload = await getAdminDashboard();
      setAdminDashboard(payload);
      setSelectedUserId((currentUserId) => currentUserId || payload.users[0]?.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  const adminUsers = useMemo(() => adminDashboard?.users || [], [adminDashboard]);
  const visibleAdminUsers = useMemo(
    () => filterAdminUsers(adminUsers, adminSearchQuery),
    [adminSearchQuery, adminUsers],
  );
  const visibleDepositRequests = useMemo(
    () => filterDepositRequests(adminDashboard?.depositRequests || [], adminSearchQuery),
    [adminDashboard?.depositRequests, adminSearchQuery],
  );

  const selectedUser = useMemo(
    () => adminUsers.find((user) => user.id === selectedUserId) || adminUsers[0],
    [adminUsers, selectedUserId],
  );

  const updateAdminSearch = useCallback(
    (value) => {
      const nextParams = new URLSearchParams(searchParams);
      const normalizedValue = value.trimStart();

      if (normalizedValue) {
        nextParams.set("search", normalizedValue);
      } else {
        nextParams.delete("search");
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleSelectUser = useCallback((userId) => {
    setSelectedUserId(userId);
    setIsDetailDrawerOpen(true);
  }, []);

  const runAdminAction = useCallback(
    async (action, successMessage, actionState) => {
      setError("");
      setSuccess("");
      setPendingAction(actionState);

      try {
        await action();
        setSuccess(successMessage);
        notify({
          description: successMessage,
          title: actionState.title,
          variant: "success",
        });
        await loadAdminDashboard();
      } catch (requestError) {
        setError(requestError.message);
        notify({
          description: requestError.message,
          title: actionState.errorTitle,
          variant: "error",
        });
      } finally {
        setPendingAction(null);
      }
    },
    [loadAdminDashboard, notify],
  );

  if (isLoading) {
    return <LoadingState label="Loading admin operations console" />;
  }

  if (!adminDashboard) {
    return <ErrorState message={error || "No admin payload returned."} onRetry={loadAdminDashboard} title="Admin console unavailable" />;
  }

  return (
    <MotionPage className="w-full min-w-0 space-y-6">
      {error ? <ErrorState message={error} onRetry={loadAdminDashboard} title="Admin action failed" /> : null}
      {success ? <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p> : null}
      {pendingAction ? <LoadingState label={pendingAction.loadingLabel} /> : null}
      <MotionItem>
        <AdminHero summary={adminDashboard.summary} />
      </MotionItem>

      <MotionItem>
        <OperationsOverview operations={adminDashboard.operations} />
      </MotionItem>

      <MotionItem className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <DepositApprovalQueue
            deposits={visibleDepositRequests}
            onApprove={(depositId) =>
              runAdminAction(() => approveDeposit(depositId), "Deposit approved and user cash updated.", {
                errorTitle: "Deposit approval failed",
                id: depositId,
                loadingLabel: "Approving deposit request",
                title: "Deposit approved",
                type: "approve-deposit",
              })
            }
            onReject={(depositId) =>
              runAdminAction(() => rejectDeposit(depositId), "Deposit rejected.", {
                errorTitle: "Deposit rejection failed",
                id: depositId,
                loadingLabel: "Rejecting deposit request",
                title: "Deposit rejected",
                type: "reject-deposit",
              })
            }
            onSelectUser={handleSelectUser}
            pendingAction={pendingAction}
            selectedUserId={selectedUser?.id}
          />
          <UserManagementCenter
            onActivate={(userId) =>
              runAdminAction(() => activateUser(userId), "User activated.", {
                errorTitle: "Activation failed",
                id: userId,
                loadingLabel: "Activating user",
                title: "User activated",
                type: "activate-user",
              })
            }
            onSearchChange={updateAdminSearch}
            onSelectUser={handleSelectUser}
            onSuspend={(userId) =>
              runAdminAction(() => suspendUser(userId), "User suspended.", {
                errorTitle: "Suspension failed",
                id: userId,
                loadingLabel: "Suspending user",
                title: "User suspended",
                type: "suspend-user",
              })
            }
            pendingAction={pendingAction}
            searchQuery={adminSearchQuery}
            selectedUserId={selectedUser?.id}
            totalUsers={adminUsers.length}
            users={visibleAdminUsers}
          />
        </div>

        <div className="space-y-6">
          <UserDetailPanel user={selectedUser} />
          <RiskAttentionWidgets attention={adminDashboard.attention} onSelectUser={handleSelectUser} />
          <AdminActivityTimeline activity={adminDashboard.activity} />
        </div>
      </MotionItem>
      {isDetailDrawerOpen ? <UserDetailDrawer onClose={() => setIsDetailDrawerOpen(false)} user={selectedUser} /> : null}
    </MotionPage>
  );
}

function filterAdminUsers(users, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return users;
  }

  return users.filter((user) =>
    [
      user.name,
      user.email,
      user.phoneNumber,
      user.role,
      user.status,
      user.riskLevel,
      user.country,
      user.timezone,
      user.lastActive,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function filterDepositRequests(deposits, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return deposits;
  }

  return deposits.filter((deposit) =>
    [
      deposit.user,
      deposit.status,
      deposit.notes,
      deposit.requestTime,
      deposit.date,
      String(deposit.amount),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
