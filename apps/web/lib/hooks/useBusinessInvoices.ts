'use client';

import { useApiResource } from './useApiResource';

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

export function useBusinessInvoices(businessId?: string | null) {
  const url = businessId ? `/api/v1/businesses/${businessId}/invoices` : null;
  const { data, loading, error, reload } =
    useApiResource<InvoiceWithItems[]>(url);

  return {
    data: data ?? [],
    loading,
    error,
    reload,
  };
}
