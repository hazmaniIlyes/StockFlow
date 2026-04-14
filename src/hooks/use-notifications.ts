import { useMemo, useRef } from 'react';

import { useInventory, useSuppliers, useExpenses, useTranslation } from 'src/contexts';
import { useInvoices } from 'src/sections/sales/context';

// ----------------------------------------------------------------------

export type AppNotification = {
  id: string;
  type:
    | 'overdue'
    | 'due-soon'
    | 'low-stock'
    | 'out-of-stock'
    | 'expiry'
    | 'supplier-due'
    | 'new-purchase'
    | 'payment-received'
    | 'expense';
  title: string;
  description: string;
  isUnRead: boolean;
  avatarUrl: string | null;
  postedAt: number;
  href: string;
};

// Safe date parsing for M/D/YYYY and YYYY-MM-DD formats
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function useNotifications(): AppNotification[] {
  const { invoices } = useInvoices();
  const { products } = useInventory();
  const { suppliers } = useSuppliers();
  const { expenses } = useExpenses();
  const { t } = useTranslation();

  // Cache: notificationId → { hash, postedAt }
  // When a notification is new OR its content changed → stamp with Date.now()
  const cache = useRef<Map<string, { hash: string; postedAt: number }>>(new Map());

  // Resolve postedAt: returns current time for new/updated notifications,
  // or the existing timestamp for unchanged ones.
  function resolvePostedAt(id: string, hash: string): number {
    const entry = cache.current.get(id);
    if (!entry || entry.hash !== hash) {
      const ts = Date.now();
      cache.current.set(id, { hash, postedAt: ts });
      return ts;
    }
    return entry.postedAt;
  }

  const notifications = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: AppNotification[] = [];

    // Max notifications generated per type — keeps total well under 50
    const MAX_PER_TYPE = 10;

    // 1. Overdue payments
    invoices
      .filter((inv) => {
        if (inv.status === 'paid') return false;
        const due = parseDate(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      })
      .slice(0, MAX_PER_TYPE)
      .forEach((inv) => {
        const due = parseDate(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const days = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
        const id = `overdue-${inv.id}`;
        const description = t('layout.notifOverdueDesc', {
          number: inv.invoiceNumber,
          client: inv.client.name,
          days,
          amount: inv.amountDue.toLocaleString(),
        });
        result.push({
          id,
          type: 'overdue',
          title: t('layout.notifOverdueTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/sales/${inv.id}`,
        });
      });

    // 2. Upcoming due dates (within 3 days)
    invoices
      .filter((inv) => {
        if (inv.status === 'paid') return false;
        const due = parseDate(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
        return diffDays >= 0 && diffDays <= 3;
      })
      .slice(0, MAX_PER_TYPE)
      .forEach((inv) => {
        const due = parseDate(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
        const whenLabel =
          diffDays === 0
            ? t('layout.today')
            : diffDays === 1
              ? t('layout.tomorrow')
              : String(diffDays);
        const id = `due-soon-${inv.id}`;
        const description = t('layout.notifDueSoonDesc', {
          number: inv.invoiceNumber,
          client: inv.client.name,
          days: whenLabel,
          amount: inv.amountDue.toLocaleString(),
        });
        result.push({
          id,
          type: 'due-soon',
          title: t('layout.notifDueSoonTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/sales/${inv.id}`,
        });
      });

    // 3. Out of stock
    products
      .filter((p) => p.status === 'out-of-stock')
      .slice(0, MAX_PER_TYPE)
      .forEach((p) => {
        const id = `out-stock-${p.id}`;
        const description = t('layout.notifOutOfStockDesc', { name: p.name });
        result.push({
          id,
          type: 'out-of-stock',
          title: t('layout.notifOutOfStockTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/inventory/${p.id}`,
        });
      });

    // 4. Low stock
    products
      .filter((p) => p.status === 'low-stock')
      .slice(0, MAX_PER_TYPE)
      .forEach((p) => {
        const id = `low-stock-${p.id}`;
        const description = t('layout.notifLowStockDesc', { name: p.name, count: p.stock });
        result.push({
          id,
          type: 'low-stock',
          title: t('layout.notifLowStockTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/inventory/${p.id}`,
        });
      });

    // 5. Product expiry (within 14 days)
    products
      .filter((p) => {
        if (!p.expiryDate) return false;
        const expiry = parseDate(p.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
        return diffDays >= 0 && diffDays <= 14;
      })
      .slice(0, MAX_PER_TYPE)
      .forEach((p) => {
        const expiry = parseDate(p.expiryDate!);
        expiry.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
        const id = `expiry-${p.id}`;
        const description = t('layout.notifExpiryDesc', { name: p.name, days: diffDays });
        result.push({
          id,
          type: 'expiry',
          title: t('layout.notifExpiryTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/inventory/${p.id}`,
        });
      });

    // 6. Supplier balance owed
    suppliers
      .filter((s) => s.totalOwed > 0)
      .slice(0, MAX_PER_TYPE)
      .forEach((s) => {
        const id = `supplier-due-${s.id}`;
        const description = t('layout.notifSupplierDueDesc', {
          supplier: s.name,
          amount: s.totalOwed.toLocaleString(),
        });
        result.push({
          id,
          type: 'supplier-due',
          title: t('layout.notifSupplierDueTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/suppliers/${s.id}`,
        });
      });

    // 7. Recent purchases (within 7 days)
    suppliers.forEach((s) => {
      (s.purchases ?? [])
        .filter((purchase) => {
          const diffDays = Math.floor((now - parseDate(purchase.date).getTime()) / 86_400_000);
          return diffDays <= 7;
        })
        .slice(0, MAX_PER_TYPE)
        .forEach((purchase) => {
          const id = `purchase-${purchase.id}`;
          const description = t('layout.notifNewPurchaseDesc', {
            supplier: s.name,
            amount: purchase.total.toLocaleString(),
          });
          result.push({
            id,
            type: 'new-purchase',
            title: t('layout.notifNewPurchaseTitle'),
            description,
            isUnRead: true,
            avatarUrl: null,
            postedAt: resolvePostedAt(id, description),
            href: `/suppliers/${s.id}`,
          });
        });
    });

    // 8. Payment received — invoices fully paid within last 7 days
    invoices
      .filter((inv) => {
        if (inv.status !== 'paid' || inv.amountPaid <= 0) return false;
        const diffDays = Math.floor((now - parseDate(inv.createdAt).getTime()) / 86_400_000);
        return diffDays <= 7;
      })
      .slice(0, MAX_PER_TYPE)
      .forEach((inv) => {
        const id = `paid-${inv.id}`;
        const description = t('layout.notifPaymentReceivedDesc', {
          number: inv.invoiceNumber,
          client: inv.client.name,
          amount: inv.amountPaid.toLocaleString(),
        });
        result.push({
          id,
          type: 'payment-received',
          title: t('layout.notifPaymentReceivedTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: `/sales/${inv.id}`,
        });
      });

    // 9. Recent expenses (within 7 days)
    expenses
      .filter((exp) => {
        const diffDays = Math.floor((now - parseDate(exp.date).getTime()) / 86_400_000);
        return diffDays <= 7;
      })
      .slice(0, MAX_PER_TYPE)
      .forEach((exp) => {
        const id = `expense-${exp.id}`;
        const description = t('layout.notifExpenseDesc', {
          desc: exp.description,
          amount: exp.amount.toLocaleString(),
        });
        result.push({
          id,
          type: 'expense',
          title: t('layout.notifExpenseTitle'),
          description,
          isUnRead: true,
          avatarUrl: null,
          postedAt: resolvePostedAt(id, description),
          href: '/expenses',
        });
      });

    // Sort: most recent first
    return result.sort((a, b) => b.postedAt - a.postedAt);
  }, [invoices, products, suppliers, expenses, t]);

  return notifications;
}
