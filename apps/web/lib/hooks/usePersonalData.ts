/**
 * Custom hooks for Personal domain data
 */

'use client';

import { useEffect, useState } from 'react';
import {
  fetchPersonalOverview,
  fetchPersonalAccounts,
  fetchPersonalRecentTransactions,
  fetchPersonalTransactionsAll,
  createPersonalTransaction,
  updatePersonalTransaction,
  deletePersonalTransaction,
  createPersonalAccount,
  updatePersonalAccount,
  deletePersonalAccount,
  fetchPersonalBudgets,
  createPersonalBudget,
  updatePersonalBudget,
  deletePersonalBudget,
  fetchPersonalSavingsPlan,
} from '@/lib/api/personal';
import type {
  PersonalOverview,
  PersonalAccount,
  PersonalTransaction,
  PersonalBudget,
  PersonalSavingsPlan,
} from '@/lib/api/types';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Hook to fetch personal overview
 */
export function usePersonalOverview(): UseDataState<PersonalOverview> {
  const [data, setData] = useState<PersonalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalOverview();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch personal overview'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadToken]);

  return { data, loading, error, reload };
}

/**
 * Hook to fetch personal accounts
 */
export function usePersonalAccounts(): UseDataState<PersonalAccount[]> {
  const [data, setData] = useState<PersonalAccount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalAccounts();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch personal accounts'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadToken]);

  return { data, loading, error, reload };
}

/**
 * Hook to fetch recent personal transactions
 */
export function usePersonalRecentTransactions(
  limit = 5
): UseDataState<PersonalTransaction[]> {
  const [data, setData] = useState<PersonalTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalRecentTransactions(limit);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch personal transactions')
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [limit, reloadToken]);

  return { data, loading, error, reload };
}

export function usePersonalTransactions(): UseDataState<PersonalTransaction[]> {
  const [data, setData] = useState<PersonalTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalTransactionsAll();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch personal transactions')
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadToken]);

  return { data, loading, error, reload };
}

export function usePersonalBudgets(): UseDataState<PersonalBudget[]> {
  const [data, setData] = useState<PersonalBudget[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalBudgets();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch personal budgets'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reloadToken]);

  return { data, loading, error, reload };
}

/**
 * Hook to fetch personal savings plan (requires params)
 */
export function usePersonalSavingsPlan(params: {
  targetAmount?: number;
  targetDate?: string;
  currentSavings?: number;
}): UseDataState<PersonalSavingsPlan | null> {
  const [data, setData] = useState<PersonalSavingsPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = () => setReloadToken((x) => x + 1);

  useEffect(() => {
    if (!params.targetAmount || !params.targetDate) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchPersonalSavingsPlan({
          targetAmount: params.targetAmount!,
          targetDate: params.targetDate!,
          currentSavings: params.currentSavings,
        });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch savings plan'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.targetAmount, params.targetDate, params.currentSavings, reloadToken]);

  return { data, loading, error, reload };
}

export const personalActions = {
  createTransaction: createPersonalTransaction,
  createAccount: createPersonalAccount,
  updateAccount: updatePersonalAccount,
  deleteAccount: deletePersonalAccount,
  createBudget: createPersonalBudget,
  updateBudget: updatePersonalBudget,
  deleteBudget: deletePersonalBudget,
  updateTransaction: updatePersonalTransaction,
  deleteTransaction: deletePersonalTransaction,
};
