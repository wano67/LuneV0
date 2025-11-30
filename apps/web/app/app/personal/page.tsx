'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button, Card, PageHeader } from "@/components/ui";
import { safeCurrency } from "@/lib/utils/currency";
import { apiFetch } from "@/lib/api/http";

type OverviewResponse = {
  summary: {
    totalNetWorth: number;
    totalCash: number;
    monthIncome: number;
    monthExpense: number;
    monthNetCashflow: number;
    currency: string;
  };
  period?: {
    from: string;
    to: string;
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
  };
  series?: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  categories?: Array<{
    name: string;
    total: number;
    count: number;
  }>;
  budgets?: {
    activeBudget?: {
      id: string;
      name: string | null;
      periodType: string;
      year: number;
      month: number;
      totalLimit: number | null;
      totalSpent: number | null;
      utilizationPct: number | null;
    } | null;
  };
  accounts: {
    topAccounts: Array<{
      id: string;
      name: string;
      type: string;
      currency: string;
      balance: number;
      includeInNetWorth: boolean;
    }>;
  };
  transactions: {
    recent: Array<{
      id: string;
      date: string;
      label: string;
      amount: number;
      direction: "in" | "out";
      accountName: string;
      categoryName?: string | null;
    }>;
  };
};

type ApiResponse<T> = { data: T };

const formatCurrency = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency(currency),
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const relativeDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

function LoadingPlaceholder() {
  return <div className="h-24 bg-surfaceAlt rounded-[16px] animate-pulse border border-white/5" />;
}

export default function PersonalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [from, setFrom] = useState<string | undefined>(searchParams.get("from") ?? undefined);
  const [to, setTo] = useState<string | undefined>(searchParams.get("to") ?? undefined);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.replace(`/app/personal${qs ? `?${qs}` : ""}`);
  }, [from, to, router]);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const response = await apiFetch<ApiResponse<OverviewResponse>>(
        `/api/v1/personal/overview${params.toString() ? `?${params.toString()}` : ""}`,
        { auth: true },
      );
      setData(response.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch personal overview";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const summary = data?.summary;
  const currency = summary?.currency ?? "EUR";
  const period = data?.period;

  const metrics = useMemo(
    () => [
      {
        label: "Total net worth",
        value: formatCurrency(summary?.totalNetWorth ?? 0, currency),
        hint: "Assets minus liabilities",
        accent: "from-[#6ee7ff]/40 via-[#7c9bff]/25 to-transparent",
      },
      {
        label: "Cash available",
        value: formatCurrency(summary?.totalCash ?? 0, currency),
        hint: "Liquid accounts",
        accent: "from-[#34d399]/35 via-transparent to-transparent",
      },
      {
        label: "Monthly net",
        value: formatCurrency(summary?.monthNetCashflow ?? 0, currency),
        hint: `${formatCurrency(summary?.monthIncome ?? 0, currency)} in / ${formatCurrency(
          summary?.monthExpense ?? 0,
          currency,
        )} out`,
        accent: "from-[#a855f7]/30 via-transparent to-transparent",
      },
      {
        label: "Savings rate",
        value: period ? `${(period.savingsRate * 100).toFixed(1)}%` : "—",
        hint: "Over selected period",
        accent: "from-[#f97316]/30 via-transparent to-transparent",
      },
    ],
    [summary, currency, period],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PageHeader title="Personal finance" description="Track your personal net worth, spending, and activity." />
        <div className="flex gap-2">
          <Link href="/app/personal/transactions">
            <Button>New transaction</Button>
          </Link>
          <Link href="/app/personal/accounts">
            <Button variant="outline">New account</Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 text-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={from ?? ""}
              onChange={(e) => setFrom(e.target.value || undefined)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={to ?? ""}
              onChange={(e) => setTo(e.target.value || undefined)}
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFrom(undefined);
                setTo(undefined);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-danger text-sm p-4">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="relative overflow-hidden bg-surface p-4">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.accent}`} />
            <div className="relative space-y-2">
              <p className="text-xs uppercase tracking-wide text-textMuted">{metric.label}</p>
              <p className="text-2xl font-semibold text-text">{loading ? "…" : metric.value}</p>
              <p className="text-sm text-textMuted">{metric.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4 text-sm space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Income vs expenses</div>
              {period && (
                <div className="text-xs text-textMuted">
                  Period {period.from} → {period.to} — Savings rate {(period.savingsRate * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 text-xs">
            <div>
              <div className="text-textMuted">Income</div>
              <div className="font-semibold">{period ? `${formatCurrency(period.income, currency)}` : "—"}</div>
            </div>
            <div>
              <div className="text-textMuted">Expenses</div>
              <div className="font-semibold">{period ? `${formatCurrency(period.expense, currency)}` : "—"}</div>
            </div>
            <div>
              <div className="text-textMuted">Net</div>
              <div className={`font-semibold ${period && period.net >= 0 ? "text-success" : "text-danger"}`}>
                {period ? `${formatCurrency(period.net, currency)}` : "—"}
              </div>
            </div>
          </div>

          {data?.series && data.series.length > 0 && (
            <div className="mt-2 text-xs text-textMuted space-y-1">
              {data.series.map((p) => (
                <div key={p.month} className="flex justify-between rounded border border-white/5 px-2 py-1">
                  <span>{p.month}</span>
                  <span className={p.net >= 0 ? "text-success" : "text-danger"}>
                    {p.net >= 0 ? "+" : ""}
                    {formatCurrency(p.net, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {loading && <LoadingPlaceholder />}
        </Card>

        <Card className="p-4 text-sm">
          <div className="flex justify-between mb-2">
            <div className="font-medium">Spending by category</div>
            <Link href="/app/personal/transactions" className="text-xs text-primary hover:underline">
              Details →
            </Link>
          </div>
          {loading ? (
            <LoadingPlaceholder />
          ) : data?.categories && data.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.categories.map((c) => (
                <div key={c.name} className="border rounded px-2 py-1 text-xs flex flex-col">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-textMuted">
                    {formatCurrency(c.total, currency)} • {c.count} tx
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textMuted">No categorized spending for this period.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 text-sm lg:col-span-2">
          <div className="flex justify-between mb-2">
            <div className="font-medium">Budget snapshot</div>
            <Link href="/app/personal/budgets" className="text-xs text-primary hover:underline">
              Manage budgets →
            </Link>
          </div>
          {loading ? (
            <LoadingPlaceholder />
          ) : data?.budgets?.activeBudget ? (
            <div className="space-y-2">
              <div className="font-medium">{data.budgets.activeBudget.name ?? "Active budget"}</div>
              <div className="text-xs text-textMuted">
                Limit: {formatCurrency(data.budgets.activeBudget.totalLimit ?? 0, currency)} — Spent:{" "}
                {formatCurrency(data.budgets.activeBudget.totalSpent ?? 0, currency)}
              </div>
              <div className="h-2 bg-surfaceAlt rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, data.budgets.activeBudget.utilizationPct ?? 0)}%`,
                  }}
                />
              </div>
              <div className="text-xs">
                Utilization: {(data.budgets.activeBudget.utilizationPct ?? 0).toFixed(1)}%
              </div>
            </div>
          ) : (
            <p className="text-xs text-textMuted">No active budget. Create one to track your spending.</p>
          )}
        </Card>

        <Card className="p-4 text-sm">
          <div className="flex justify-between mb-2">
            <div className="font-medium">Top accounts</div>
            <Link href="/app/personal/accounts" className="text-xs text-primary hover:underline">
              Manage →
            </Link>
          </div>
          {loading ? (
            <LoadingPlaceholder />
          ) : data?.accounts?.topAccounts?.length ? (
            <ul className="space-y-2">
              {data.accounts.topAccounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-textMuted">
                      {a.type} • {a.currency}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(a.balance, a.currency)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-textMuted">No accounts configured yet.</p>
          )}
        </Card>
      </div>

      <Card className="p-4 text-sm">
        <div className="flex justify-between mb-2">
          <div className="font-medium">Recent activity</div>
          <Link href="/app/personal/transactions" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <LoadingPlaceholder />
        ) : data?.transactions?.recent?.length ? (
          <div className="space-y-3">
            {data.transactions.recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-surfaceAlt px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-text">{t.label}</p>
                  <p className="text-xs text-textMuted">
                    {relativeDate(t.date)} • {t.accountName}
                    {t.categoryName ? ` • ${t.categoryName}` : ""}
                  </p>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    t.direction === "out" ? "text-danger" : "text-success"
                  }`}
                >
                  {t.direction === "out" ? "-" : "+"}
                  {formatCurrency(Math.abs(t.amount), currency)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-textMuted">No recent transactions.</p>
        )}
      </Card>

      {loading && (
        <div className="text-xs text-textMuted">Loading your personal overview...</div>
      )}
    </div>
  );
}
