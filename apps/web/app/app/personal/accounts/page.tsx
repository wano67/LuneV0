"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Button, Card, Dialog, PageHeader } from "@/components/ui";
import { personalActions, usePersonalAccounts } from "@/lib/hooks/usePersonalData";
import { safeCurrency } from "@/lib/utils/currency";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const formatCurrency = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export default function AccountsPage() {
  const { data, loading, error, reload } = usePersonalAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"new" | "edit">("new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [currency, setCurrency] = useState("EUR");
  const [includeBudget, setIncludeBudget] = useState(true);
  const [includeNetWorth, setIncludeNetWorth] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const [initialBalance, setInitialBalance] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setType("checking");
    setCurrency("EUR");
    setIncludeBudget(true);
    setIncludeNetWorth(true);
    setIsArchived(false);
    setInitialBalance(undefined);
    setFormError(null);
    setEditingId(null);
    setEditMode("new");
  };

  const openNewDialog = () => {
    resetForm();
    setEditMode("new");
    setDialogOpen(true);
  };

  const openEditDialog = (acc: any) => {
    setName(acc.name);
    setType(acc.type ?? "checking");
    setCurrency(acc.currency ?? "EUR");
    setIncludeBudget(!!acc.includeInBudget);
    setIncludeNetWorth(!!acc.includeInNetWorth);
    setIsArchived(!!acc.isArchived);
    setInitialBalance(acc.initialBalance ?? undefined);
    setEditingId(acc.id);
    setEditMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      if (editMode === "new") {
        await personalActions.createAccount({
          name,
          type,
          currency,
          includeInBudget: includeBudget,
          includeInNetWorth: includeNetWorth,
          isArchived,
          initialBalance: initialBalance ?? undefined,
        });
        toast.success("Account created");
      } else if (editMode === "edit" && editingId) {
        await personalActions.updateAccount(editingId, {
          name,
          type,
          currency,
          includeInBudget: includeBudget,
          includeInNetWorth: includeNetWorth,
          isArchived,
        });
        toast.success("Account updated");
      }
      setDialogOpen(false);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save account";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async (acc: any, archived: boolean) => {
    try {
      await personalActions.updateAccount(acc.id, { isArchived: archived });
      toast.success(archived ? "Account archived" : "Account unarchived");
      reload();
    } catch (err) {
      toast.error("Failed to update account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this account?")) return;
    setSubmitting(true);
    try {
      await personalActions.deleteAccount(id);
      toast.success("Account deleted");
      setDialogOpen(false);
      resetForm();
      reload();
    } catch (err) {
      toast.error("Failed to delete account");
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = error && error.message.includes("(404)");

  const accounts = useMemo(() => data ?? [], [data]);
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isArchived), [accounts]);
  const archivedAccounts = useMemo(() => accounts.filter((a) => a.isArchived), [accounts]);

  const totalCount = accounts.length;
  const budgetCount = accounts.filter((a) => a.includeInBudget).length;
  const netWorthCount = accounts.filter((a) => a.includeInNetWorth).length;
  const archivedCount = archivedAccounts.length;

  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => {
      const cur = a.currency ?? "EUR";
      const balance = typeof a.balance === "number" ? a.balance : 0;
      map.set(cur, (map.get(cur) ?? 0) + balance);
    });
    return Array.from(map.entries());
  }, [accounts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Personal accounts"
          description="Manage your personal accounts"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/personal/transactions">
            <Button variant="ghost">View transactions</Button>
          </Link>
          <Button onClick={openNewDialog}>New account</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">Total accounts</p>
          <p className="text-2xl font-semibold text-text">{totalCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">In budgets</p>
          <p className="text-2xl font-semibold text-text">{budgetCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">In net worth</p>
          <p className="text-2xl font-semibold text-text">{netWorthCount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-textMuted">Archived</p>
          <p className="text-2xl font-semibold text-text">{archivedCount}</p>
        </Card>
      </div>

      {totalsByCurrency.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-textMuted">Balances by currency</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {totalsByCurrency.map(([cur, total]) => (
              <div key={cur} className="flex items-center justify-between rounded-lg bg-surfaceAlt px-3 py-2 border border-border/60">
                <span className="text-sm text-textMuted">{cur}</span>
                <span className="font-semibold text-text">{formatCurrency(total, cur)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-textMuted">Loading...</p>
        ) : emptyState ? (
          <p className="text-textMuted text-sm">No accounts yet. Add one to get started.</p>
        ) : error ? (
          <p className="text-danger text-sm">{error.message}</p>
        ) : !activeAccounts || activeAccounts.length === 0 ? (
          <p className="text-textMuted text-sm">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-textMuted">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Currency</th>
                  <th className="py-2 pr-4 text-right">Balance</th>
                  <th className="py-2 pr-4">In budget</th>
                  <th className="py-2 pr-4">In net worth</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-text">
                {activeAccounts.map((acc) => (
                  <tr key={acc.id} className="border-t border-border group hover:bg-surfaceAlt/40">
                    <td className="py-2 pr-4 font-medium">{acc.name}</td>
                  <td className="py-2 pr-4">{acc.type ?? "—"}</td>
                  <td className="py-2 pr-4">{acc.currency ?? "EUR"}</td>
                  <td className="py-2 pr-4 text-right">
                    {formatCurrency(acc.balance ?? 0, acc.currency ?? "EUR")}
                  </td>
                  <td className="py-2 pr-4">{acc.includeInBudget ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4">{acc.includeInNetWorth ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4 text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleArchiveToggle(acc, true)}>
                          Archive
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(acc)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {archivedAccounts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-text">Archived accounts</p>
            <p className="text-xs text-textMuted">{archivedAccounts.length} archived</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-textMuted">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Currency</th>
                  <th className="py-2 pr-4 text-right">Balance</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-text">
                {archivedAccounts.map((acc) => (
                  <tr key={acc.id} className="border-t border-border group hover:bg-surfaceAlt/40">
                    <td className="py-2 pr-4 font-medium">{acc.name}</td>
                  <td className="py-2 pr-4">{acc.type ?? "—"}</td>
                  <td className="py-2 pr-4">{acc.currency ?? "EUR"}</td>
                  <td className="py-2 pr-4 text-right">
                    {formatCurrency(acc.balance ?? 0, acc.currency ?? "EUR")}
                  </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleArchiveToggle(acc, false)}>
                          Unarchive
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(acc)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (submitting) return;
          setDialogOpen(false);
          resetForm();
        }}
        title={editMode === "new" ? "New account" : "Edit account"}
        description={
          editMode === "new"
            ? "Create a personal account to start tracking balances."
            : "Edit your account details."
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-textMuted">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-textMuted">Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-textMuted">Currency</label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={includeBudget}
                onChange={(e) => setIncludeBudget(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-[#0f0f11]"
              />
              Include in budget
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={includeNetWorth}
                onChange={(e) => setIncludeNetWorth(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-[#0f0f11]"
              />
              Include in net worth
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-[#0f0f11]"
              />
              Mark as archived
            </label>
          </div>
          <div>
            <label className="text-sm text-textMuted">Initial balance (optional)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f11] px-3 py-2 text-text placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={initialBalance ?? ""}
              onChange={(e) => setInitialBalance(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}

          {editMode === "edit" && editingId && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                Danger zone
              </p>
              <p className="text-xs text-textMuted">
                Delete this account. This action cannot be undone.
              </p>
              <Button
                variant="ghost"
                className="w-full text-red-400 hover:bg-red-500/10"
                onClick={() => handleDelete(editingId)}
              >
                Delete account
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
              {submitting ? "Saving..." : editMode === "new" ? "Save account" : "Update account"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
