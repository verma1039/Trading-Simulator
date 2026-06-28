import { useCallback, useEffect, useMemo, useState } from "react";

import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { MotionItem, MotionPage } from "@/components/motion/MotionPage";
import {
  AccountHero,
  AccountInsights,
  ActivitySummary,
  DepositRequestCenter,
  RequestStatusWidget,
  TransactionHistory,
  TransactionTimeline,
} from "@/components/transactions/TransactionsWorkspace";
import { createDepositRequest, getTransactions } from "@/services/transactionsService";
import { useToast } from "@/context/useToast";

export default function TransactionsPage() {
  const { notify } = useToast();
  const [transactions, setTransactions] = useState(null);
  const [depositDraft, setDepositDraft] = useState({
    amount: 0,
    notes: "",
    processingEstimate: "Requests remain pending until an admin approves or rejects them.",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    sort: "newest",
    status: "All",
    type: "All",
  });

  const loadTransactions = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const payload = await getTransactions();
      setTransactions(payload);
      setDepositDraft((currentDraft) => ({
        ...payload.depositDraft,
        amount: currentDraft.amount || payload.depositDraft.amount,
        notes: currentDraft.notes || payload.depositDraft.notes,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredHistory = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const history = transactions?.history || [];

    return history
      .filter((item) => {
        const matchesType = filters.type === "All" || item.type === filters.type;
        const matchesStatus = filters.status === "All" || item.status === filters.status;
        const searchable = [item.date, item.type, item.status, item.detail, String(item.amount)].join(" ").toLowerCase();
        const matchesSearch = !query || searchable.includes(query);

        return matchesType && matchesStatus && matchesSearch;
      })
      .sort((first, second) => {
        if (filters.sort === "amount-desc") {
          return Math.abs(second.amount) - Math.abs(first.amount);
        }

        if (filters.sort === "amount-asc") {
          return Math.abs(first.amount) - Math.abs(second.amount);
        }

        return second.date.localeCompare(first.date);
      });
  }, [filters, transactions?.history]);

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  async function handleDepositRequest() {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await createDepositRequest({
        amount: Number(depositDraft.amount),
        notes: depositDraft.notes,
      });
      setSuccess("Deposit request created and queued for admin approval.");
      notify({
        description: "Your request is now pending admin review.",
        title: "Deposit request submitted",
        variant: "success",
      });
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message);
      notify({
        description: requestError.message,
        title: "Deposit request failed",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading account activity" />;
  }

  if (error && !transactions) {
    return <ErrorState message={error} onRetry={loadTransactions} title="Transactions unavailable" />;
  }

  if (!transactions) {
    return <ErrorState message={error || "No transaction payload returned."} onRetry={loadTransactions} title="Transactions unavailable" />;
  }

  return (
    <MotionPage className="max-w-full space-y-6 overflow-x-hidden">
      {error ? <ErrorState message={error} onRetry={loadTransactions} title="Transaction action failed" /> : null}
      {success ? <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p> : null}
      <MotionItem>
        <AccountHero summary={transactions.summary} />
      </MotionItem>

      <MotionItem className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <DepositRequestCenter
            draft={depositDraft}
            isSubmitting={isSubmitting}
            onAmountChange={(amount) => setDepositDraft((currentDraft) => ({ ...currentDraft, amount }))}
            onNotesChange={(notes) => setDepositDraft((currentDraft) => ({ ...currentDraft, notes }))}
            onSubmit={handleDepositRequest}
            pendingCount={transactions.summary.pendingCount}
            pendingTotal={transactions.summary.pendingDeposits}
          />
          <TransactionHistory filters={filters} onFilterChange={handleFilterChange} rows={filteredHistory} />
        </div>

        <div className="space-y-6">
          <RequestStatusWidget statuses={transactions.requestStatusSummary} />
          <AccountInsights insights={transactions.insights} />
          <ActivitySummary items={transactions.activitySummary} />
        </div>
      </MotionItem>

      <MotionItem>
        <TransactionTimeline items={transactions.timeline} />
      </MotionItem>
    </MotionPage>
  );
}
