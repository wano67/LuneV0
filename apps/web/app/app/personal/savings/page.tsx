'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button, Card, PageHeader } from "@/components/ui";
import {
  usePersonalAccounts,
  usePersonalSavingsPlan,
} from "@/lib/hooks/usePersonalData";
import { safeCurrency } from "@/lib/utils/currency";

const formatCurrency = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export default function PersonalSavingsPage() {
  const personalAccounts = usePersonalAccounts?.();

  // Mémoïse la liste de comptes pour éviter le warning react-hooks/exhaustive-deps
  const accounts = useMemo(
    () => ((personalAccounts?.data ?? []) as any[]),
    [personalAccounts?.data],
  );

  const defaultCurrentSavings = useMemo(() => {
    if (!accounts || accounts.length === 0) return 0;
    return accounts.reduce(
      (sum: number, a: any) => sum + (a.balance ?? 0),
      0,
    );
  }, [accounts]);

  const [targetAmount, setTargetAmount] = useState<number | undefined>();
  const [targetDate, setTargetDate] = useState<string>("");
  const [currentSavings, setCurrentSavings] = useState<number | undefined>(
    defaultCurrentSavings || undefined,
  );

  // params used to trigger the hook only when user clicks "Calculer"
  const [activeParams, setActiveParams] = useState<{
    targetAmount?: number;
    targetDate?: string;
    currentSavings?: number;
  }>({});

  const plan = usePersonalSavingsPlan({
    targetAmount: activeParams.targetAmount,
    targetDate: activeParams.targetDate,
    currentSavings: activeParams.currentSavings,
  });

  useEffect(() => {
    if (!currentSavings && defaultCurrentSavings) {
      setCurrentSavings(defaultCurrentSavings);
    }
  }, [defaultCurrentSavings, currentSavings]);

  const applyPresetMonths = (months: number) => {
    const now = new Date();
    const target = new Date(now);
    target.setMonth(target.getMonth() + months);
    setTargetDate(target.toISOString().slice(0, 10));
  };

  const handleCompute = () => {
    const amount = typeof targetAmount === "number" ? targetAmount : Number.NaN;
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Montant cible invalide.");
      return;
    }
    if (!targetDate) {
      toast.error("Date cible obligatoire.");
      return;
    }
    setActiveParams({
      targetAmount: amount,
      targetDate,
      currentSavings: currentSavings ?? 0,
    });
    plan.reload();
  };

  const resetForm = () => {
    setTargetAmount(undefined);
    setTargetDate("");
    setCurrentSavings(defaultCurrentSavings || undefined);
    setActiveParams({});
  };

  const statusLabel = useMemo(() => {
    if (!plan.data) return "";
    switch (plan.data.status) {
      case "on_track":
        return "Tu es dans les clous ✅";
      case "stretch":
        return "Tu es en retard sur l’objectif ⚠️";
      case "unrealistic":
        return "Objectif irréaliste avec ta situation actuelle ❌";
      default:
        return plan.data.status;
    }
  }, [plan.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Épargne & objectifs"
        description="Planifie tes objectifs et vois combien mettre de côté chaque mois."
      />

      <Card className="p-4 text-sm space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <div className="font-medium">Nouvel objectif d’épargne</div>
            <div className="text-xs text-textMuted">
              Ex : 3 000 € pour un voyage, un coussin de sécurité, un achat…
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium">Montant cible</label>
            <input
              type="number"
              className="w-full rounded border px-2 py-1"
              value={targetAmount ?? ""}
              onChange={(e) =>
                setTargetAmount(
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="ex : 3000"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">Date cible</label>
            <input
              type="date"
              className="w-full rounded border px-2 py-1"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-textMuted">
              <button
                type="button"
                className="underline"
                onClick={() => applyPresetMonths(3)}
              >
                +3 mois
              </button>
              <button
                type="button"
                className="underline"
                onClick={() => applyPresetMonths(6)}
              >
                +6 mois
              </button>
              <button
                type="button"
                className="underline"
                onClick={() => applyPresetMonths(12)}
              >
                +12 mois
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium">Épargne actuelle</label>
            <input
              type="number"
              className="w-full rounded border px-2 py-1"
              value={currentSavings ?? ""}
              onChange={(e) =>
                setCurrentSavings(
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="Ce que tu as déjà de côté"
            />
            {defaultCurrentSavings > 0 && (
              <div className="mt-1 text-[11px] text-textMuted">
                Suggestion : ≈{" "}
                {formatCurrency(defaultCurrentSavings, accounts[0]?.currency)}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={plan.loading}
          >
            Réinitialiser
          </Button>
          <Button
            type="button"
            onClick={handleCompute}
            disabled={plan.loading}
          >
            {plan.loading ? "Calcul en cours…" : "Calculer le plan"}
          </Button>
        </div>

        {plan.error && (
          <p className="mt-2 text-xs text-danger">{plan.error.message}</p>
        )}
      </Card>

      {plan.data && (
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <Card className="space-y-2 p-4">
            <div className="text-xs text-textMuted">Résumé de l’objectif</div>
            <div className="text-xl font-semibold">
              {formatCurrency(
                plan.data.targetAmount,
                plan.data.baseCurrency,
              )}
            </div>
            <div className="text-xs text-textMuted">
              Objectif au {plan.data.targetDate} • Aujourd&apos;hui :{" "}
              {plan.data.today}
            </div>
            <div className="text-xs text-textMuted">
              Temps restant : {plan.data.monthsRemaining} mois (
              {plan.data.daysRemaining} jours)
            </div>
            <div className="mt-2 text-xs">
              Épargne actuelle prise en compte :{" "}
              <span className="font-medium">
                {formatCurrency(
                  plan.data.effectiveCurrentSavings,
                  plan.data.baseCurrency,
                )}
              </span>
            </div>
            <div className="mt-2 text-xs">
              <span className="font-medium">Statut : </span>
              {statusLabel}
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <div className="text-xs text-textMuted">
              Ce que tu dois mettre de côté
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(
                plan.data.requiredMonthlySavings,
                plan.data.baseCurrency,
              )}{" "}
              / mois
            </div>
            <div className="text-xs text-textMuted">
              Soit environ{" "}
              <span className="font-medium">
                {formatCurrency(
                  plan.data.requiredDailySavings,
                  plan.data.baseCurrency,
                )}{" "}
                / jour
              </span>
            </div>
            <div className="mt-3 text-xs">
              Taux d&apos;épargne requis :{" "}
              <span className="font-medium">
                {(plan.data.requiredSavingsRate * 100).toFixed(1)}%
              </span>
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <div className="text-xs text-textMuted">
              Ta situation actuelle (estimation)
            </div>
            <div className="text-xs">
              Revenus mensuels estimés :{" "}
              <span className="font-medium">
                {formatCurrency(
                  plan.data.estimatedMonthlyIncome,
                  plan.data.baseCurrency,
                )}
              </span>
            </div>
            <div className="text-xs">
              Dépenses mensuelles estimées :{" "}
              <span className="font-medium">
                {formatCurrency(
                  plan.data.estimatedMonthlySpending,
                  plan.data.baseCurrency,
                )}
              </span>
            </div>
            <div className="text-xs">
              Capacité d&apos;épargne estimée :{" "}
              <span className="font-medium">
                {formatCurrency(
                  plan.data.estimatedSavingsCapacity,
                  plan.data.baseCurrency,
                )}{" "}
                / mois
              </span>
            </div>
            <div className="mt-2 text-xs text-textMuted">
              Solde actuel pris en compte :{" "}
              {formatCurrency(
                plan.data.currentBalance,
                plan.data.baseCurrency,
              )}
            </div>
          </Card>
        </div>
      )}

      {plan.data?.notes?.length ? (
        <Card className="p-4 text-sm">
          <div className="mb-2 font-medium">Recommandations personnalisées</div>
          <ul className="space-y-1 list-disc pl-4 text-xs text-textMuted">
            {plan.data.notes.map((n, idx) => (
              <li key={idx}>{n}</li>
            ))}
          </ul>
          <div className="mt-3 text-[11px] text-textMuted">
            Plan généré le {plan.data.generatedAt}.
          </div>
        </Card>
      ) : null}

      {!plan.data && !plan.loading && (
        <Card className="p-4 text-xs text-textMuted">
          Renseigne un objectif et une date, puis clique sur{" "}
          <span className="font-semibold">“Calculer le plan”</span> pour obtenir
          un rythme d’épargne mensuel réaliste.
        </Card>
      )}
    </div>
  );
}