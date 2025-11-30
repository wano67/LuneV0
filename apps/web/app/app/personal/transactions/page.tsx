'use client';

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { PageHeader, Card, Button, Dialog } from "@/components/ui";
import {
  usePersonalAccounts,
  usePersonalTransactions,
  personalActions,
} from "@/lib/hooks/usePersonalData";
import type { PersonalTransaction } from "@/lib/api/types";
import { safeCurrency } from "@/lib/utils/currency";

export default function TransactionsPage() {
  const {
    data: accounts,
    loading: accountsLoading,
    error: accountsError,
    reload: reloadAccounts,
  } = usePersonalAccounts();
  const { data, loading, error, reload } = usePersonalTransactions();

  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<"all" | "in" | "out" | "transfer">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState<"new" | "edit">("new");
  const [editingTx, setEditingTx] = useState<PersonalTransaction | null>(null);

  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [direction, setDirection] = useState<"in" | "out" | "transfer">("in");
  const [amount, setAmount] = useState<number>(0);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    const defaultAccount = accounts?.[0]?.id ?? "";
    setAccountId(defaultAccount);
    setDate("");
    setDirection("in");
    setAmount(0);
    setLabel("");
    setCategory("");
    setNotes("");
    setFormError(null);
    setEditingTx(null);
    setEditMode("new");
  };

  const openDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (tx: PersonalTransaction) => {
    setAccountId(tx.accountId);
    setDate(tx.occurredAt ? tx.occurredAt.slice(0, 10) : "");
    setDirection(tx.direction);
    setAmount(Math.abs(tx.amount));
    setLabel(tx.label);
    setCategory(tx.category ?? "");
    setNotes(tx.notes ?? "");
    setEditingTx(tx);
    setEditMode("edit");
    setFormError(null);
    setDialogOpen(true);
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((tx) => {
      const matchAccount = filterAccount === "all" || tx.accountId === filterAccount;
      const matchDir = filterDirection === "all" || tx.direction === filterDirection;
      const inRange =
        (!dateFrom || new Date(tx.occurredAt) >= new Date(dateFrom)) &&
        (!dateTo || new Date(tx.occurredAt) <= new Date(dateTo));
      return matchAccount && matchDir && inRange;
    });
  }, [data, filterAccount, filterDirection, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const income = filtered.filter((tx) => tx.direction === "in").reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filtered.filter((tx) => tx.direction === "out").reduce((sum, tx) => sum + tx.amount, 0);
    const net = income - expense;
    const currency =
      filtered.length > 0
        ? filtered[0].currency
        : accounts?.[0]?.currency ?? "EUR";
    return { income, expense, net, currency };
  }, [filtered, accounts]);

  const formatCurrency = (value: number, currency?: string) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: safeCurrency(currency),
      maximumFractionDigits: 2,
    }).format(value ?? 0);

  const handleSubmit = async () => {
    if (!accountId || !date || !label || !amount) {
      setFormError("All fields are required");
      return;
    }
    if (amount <= 0) {
      setFormError("Amount must be greater than zero");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const accountCurrency = accounts?.find((a) => a.id === accountId)?.currency ?? "EUR";
      if (editMode === "edit" && editingTx) {
        await personalActions.updateTransaction(editingTx.id, {
          accountId,
          direction,
          amount: Math.abs(amount),
          currency: accountCurrency,
          occurredAt: date,
          label,
          category,
          notes,
        } as any);
        toast.success("Transaction updated");
      } else {
        await personalActions.createTransaction({
          accountId,
          direction,
          amount: Math.abs(amount),
          currency: accountCurrency,
          occurredAt: date,
          label,
          category,
          notes,
        });
        toast.success("Transaction saved");
      }
      setDialogOpen(false);
      resetForm();
      reload();
      reloadAccounts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create transaction";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTx) return;
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setSubmitting(true);
    try {
      await personalActions.deleteTransaction(editingTx.id);
      toast.success("Transaction deleted");
      setDialogOpen(false);
      resetForm();
      reload();
      reloadAccounts();
    } catch (err) {
      toast.error("Failed to delete transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = error && error.message.includes("(404)");

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <PageHeader
          title="Personal transactions"
      description="Track and manage your personal transactions"
    />
        <Button onClick={openDialog} disabled={accountsLoading || !!accountsError}>
          Add transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">Income (filtered)</p>
          <p className="text-xl font-semibold text-success">
            {formatCurrency(totals.income, totals.currency)}
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">Expenses (filtered)</p>
          <p className="text-xl font-semibold text-danger">
            {formatCurrency(totals.expense, totals.currency)}
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">Net (filtered)</p>
          <p className={`text-xl font-semibold ${totals.net >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(totals.net, totals.currency)}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm text-text"
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
        >
          <option value="all">All accounts</option>
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm text-text"
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value as any)}
        >
          <option value="all">All directions</option>
          <option value="in">Income</option>
          <option value="out">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <input
          type="date"
          className="rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm text-text"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm text-text"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      <Card>
        {loading || accountsLoading ? (
          <p className="text-textMuted">Loading...</p>
        ) : accountsError ? (
          <p className="text-danger text-sm">Failed to load accounts: {accountsError.message}</p>
        ) : emptyState ? (
          <p className="text-textMuted text-sm">No transactions yet. Add your first transaction.</p>
        ) : error ? (
          <p className="text-danger text-sm">{error.message}</p>
        ) : !accounts || accounts.length === 0 ? (
          <p className="text-textMuted text-sm">Add an account first to create transactions.</p>
        ) : !filtered || filtered.length === 0 ? (
          <p className="text-textMuted text-sm">No transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-textMuted">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Label</th>
                  <th className="py-2 pr-4">Direction</th>
                  <th className="py-2 pr-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-text">
                {filtered.map((tx) => {
                  const accountName = accounts?.find((a) => a.id === tx.accountId)?.name ?? "Account";
                  const dirLabel = tx.direction === "in" ? "Income" : tx.direction === "out" ? "Expense" : "Transfer";
                  return (
                    <tr
                      key={tx.id}
                      className="border-t border-border hover:bg-surfaceAlt/40 cursor-pointer"
                      onClick={() => openEditDialog(tx)}
                    >
                      <td className="py-2 pr-4">{new Date(tx.occurredAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{accountName}</td>
                      <td className="py-2 pr-4">{tx.label}</td>
                      <td className="py-2 pr-4">{dirLabel}</td>
                      <td className="py-2 pr-4 text-right">
                        <span className={tx.direction === "in" ? "text-success" : "text-danger"}>
                          {tx.direction === "in" ? "+" : "-"}
                          {formatCurrency(Math.abs(tx.amount), tx.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (submitting) return;
          setDialogOpen(false);
          resetForm();
        }}
        title={editMode === "edit" ? "Edit transaction" : "New transaction"}
        description={
          editMode === "edit"
            ? "Update this transaction. Direction sets the sign; amount should be positive."
            : "Add a personal transaction. Direction sets the sign; amount should be positive."
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-textMuted">Account</label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              <option value="">Select account</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-textMuted">Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-textMuted">Direction</label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
              >
                <option value="in">Income</option>
                <option value="out">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-textMuted">Amount</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-textMuted">Category (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-textMuted">Label</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-textMuted">Notes (optional)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}

          {editMode === "edit" && editingTx && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                Danger zone
              </p>
              <p className="text-xs text-textMuted">
                Delete this transaction. This action cannot be undone.
              </p>
              <Button
                variant="ghost"
                className="w-full text-red-400 hover:bg-red-500/10"
                onClick={handleDelete}
              >
                Delete transaction
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (submitting) return;
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editMode === "edit" ? "Update transaction" : "Save transaction"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
