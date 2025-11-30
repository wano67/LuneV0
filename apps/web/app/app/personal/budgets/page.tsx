'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button, Card, Dialog, PageHeader } from "@/components/ui";
import { personalActions, usePersonalBudgets } from "@/lib/hooks/usePersonalData";
import { PersonalBudget } from "@/lib/api/types";
import { safeCurrency } from "@/lib/utils/currency";

type Mode = "new" | "edit";

const formatCurrency = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export default function PersonalBudgetsPage() {
  const { data: budgets, loading, error, reload } = usePersonalBudgets();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("new");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [amount, setAmount] = useState<number | undefined>();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const budgetsList = useMemo(() => budgets ?? [], [budgets]);

  useEffect(() => {
    if (!dialogOpen) {
      setFormError(null);
      setSubmitting(false);
    }
  }, [dialogOpen]);

  const totals = useMemo(() => {
    const totalAmount = budgetsList.reduce((sum, b) => sum + (b.amount ?? 0), 0);
    return { totalAmount };
  }, [budgetsList]);

  const resetFormToCurrentMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    setPeriodStart(toISO(first));
    setPeriodEnd(toISO(last));
  };

  const openNewDialog = () => {
    setMode("new");
    setEditingId(null);
    setName("");
    setCurrency("EUR");
    setAmount(undefined);
    resetFormToCurrentMonth();
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (b: PersonalBudget) => {
    setMode("edit");
    setEditingId(b.id);
    setName(b.name);
    setCurrency(b.currency);
    setAmount(b.amount);
    setPeriodStart(b.periodStart.slice(0, 10));
    setPeriodEnd(b.periodEnd.slice(0, 10));
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Le nom du budget est obligatoire.");
      return;
    }
    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      setFormError("Montant de budget invalide.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setFormError("La période est obligatoire.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = { name, currency, amount, periodStart, periodEnd };

      if (mode === "new") {
        await personalActions.createBudget(payload);
        toast.success("Budget créé avec succès");
      } else if (editingId) {
        await personalActions.updateBudget(editingId, payload);
        toast.success("Budget mis à jour");
      }

      setDialogOpen(false);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Impossible de sauvegarder le budget";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce budget ?")) return;
    try {
      await personalActions.deleteBudget(id);
      toast.success("Budget supprimé");
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets personnels"
        description="Planifie tes dépenses et suis leur exécution."
        actions={
          <div className="flex gap-2">
            <Button onClick={openNewDialog}>+ Nouveau budget</Button>
            <Link href="/app/personal">
              <Button variant="outline">Retour à l’overview</Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Card className="p-4 text-sm text-danger">
          {error.message}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3 text-sm">
        <Card className="p-4">
          <div className="text-xs text-textMuted">Nombre de budgets</div>
          <div className="text-2xl mt-1">{budgetsList.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-textMuted">Montant total budgeté</div>
          <div className="text-2xl mt-1">{formatCurrency(totals.totalAmount, budgetsList[0]?.currency)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-textMuted">Période par défaut</div>
          <div className="text-sm mt-1 text-textMuted">Mois courant pour les nouveaux budgets</div>
        </Card>
      </div>

      {loading ? (
        <Card className="p-4 text-sm text-textMuted">Chargement des budgets...</Card>
      ) : budgetsList.length === 0 ? (
        <Card className="p-4 text-sm text-textMuted space-y-2">
          <p>Tu n’as pas encore créé de budget.</p>
          <p>Crée un budget mensuel (ex : “Novembre – Vie courante”) pour suivre tes dépenses par rapport à un plafond.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgetsList.map((b) => {
            const periodLabel = `${b.periodStart.slice(0, 10)} → ${b.periodEnd.slice(0, 10)}`;
            const spent = (b as any).spent ?? 0;
            const utilizationPct =
              (b as any).utilizationPct ?? (b.amount > 0 ? Math.min(120, (spent / b.amount) * 100) : 0);
            const remaining = (b as any).remaining ?? b.amount - spent;
            const over = utilizationPct > 100 || remaining < 0;
            const remainingLabel =
              remaining >= 0
                ? `${formatCurrency(remaining, b.currency)} restant`
                : `${formatCurrency(Math.abs(remaining), b.currency)} au-dessus du budget`;

            return (
              <Card key={b.id} className="p-4 text-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-textMuted">{periodLabel}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-textMuted">Limite</div>
                    <div className="font-semibold">{formatCurrency(b.amount, b.currency)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Dépensé</span>
                    <span>{formatCurrency(spent, b.currency)}</span>
                  </div>
                  <div className="h-2 bg-surfaceAlt rounded-full overflow-hidden">
                    <div
                      className={`h-full ${over ? "bg-danger" : "bg-primary"}`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>{remainingLabel}</span>
                    <span className={over ? "text-danger font-medium" : ""}>{utilizationPct.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <Link
                    href={{
                      pathname: "/app/personal/transactions",
                      query: {
                        dateFrom: b.periodStart.slice(0, 10),
                        dateTo: b.periodEnd.slice(0, 10),
                      },
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Voir les transactions →
                  </Link>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => openEditDialog(b)}>
                      Modifier
                    </Button>
                    <Button size="xs" variant="ghost" className="text-danger" onClick={() => handleDelete(b.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormError(null);
          }
        }}
        title={mode === "new" ? "Nouveau budget" : "Modifier le budget"}
      >
        <div className="space-y-4 text-sm">
          {formError && <p className="text-danger">{formError}</p>}

          <div className="space-y-1">
            <label className="block text-xs font-medium">Nom du budget</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Budget mensuel Novembre"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium">Montant</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={amount ?? ""}
                onChange={(e) => setAmount(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </div>
            <div className="w-24 space-y-1">
              <label className="block text-xs font-medium">Devise</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium">Du</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-medium">Au</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-textMuted">
            <button type="button" onClick={resetFormToCurrentMonth} className="underline">
              Utiliser le mois courant
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (!submitting) setDialogOpen(false);
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enregistrement..." : mode === "new" ? "Créer le budget" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
