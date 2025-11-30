'use client';

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/http";

export type Invoice = {
  id: string;
  businessId: string;
  clientId: string;
  projectId: string | null;
  quoteId: string | null;
  number: string;
  status: string;
  currency: string;
  issuedAt: string;
  dueAt: string | null;
  subtotalAmount: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  serviceId: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  vatRate: number;
  discountPct: number;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceWithItems = {
  invoice: Invoice;
  items: InvoiceItem[];
};

type ApiResponse<T> = {
  data: T;
};

export function useBusinessInvoices(businessId?: string | null) {
  const [data, setData] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!businessId) {
      setData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<ApiResponse<InvoiceWithItems[]>>(
        `/businesses/${businessId}/invoices`,
        { method: "GET", auth: true }
      );
      setData(res.data ?? []);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to load invoices");
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    void reload();
  }, [businessId, reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}