import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { useClients, useExpenses, useInventory, useSuppliers, useTranslation } from 'src/contexts';
import { useInvoices } from 'src/sections/sales/context';

import { ReportsSummaryCards } from '../reports-summary-cards';
import { ReportsRevenueExpensesChart } from '../reports-revenue-expenses-chart';
import { ReportsProfitMarginChart } from '../reports-profit-margin-chart';
import { ReportsBreakdownTabs } from '../reports-breakdown-tabs';

// ======================================================================

const DATE_RANGE_VALUES = ['this-month', 'last-month', 'this-year', 'all'] as const;

type DateRange = (typeof DATE_RANGE_VALUES)[number];

// ======================================================================

function filterByDateRange<T>(items: T[], dateExtractor: (item: T) => string, range: DateRange): T[] {
  if (range === 'all') return items;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return items.filter((item) => {
    const d = new Date(dateExtractor(item));
    if (range === 'this-month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (range === 'last-month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }
    if (range === 'this-year') return d.getFullYear() === currentYear;
    return true;
  });
}

// ======================================================================

export function ReportsView() {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const { t, language, dir } = useTranslation();

  const dateRangeLabels: Record<DateRange, string> = {
    'this-month': t('reports.thisMonth'),
    'last-month': t('reports.lastMonth'),
    'this-year': t('reports.thisYear'),
    'all': t('reports.allTime'),
  };

  // Get data from contexts
  const { invoices } = useInvoices();
  const { clients } = useClients();
  const { suppliers } = useSuppliers();
  const { expenses } = useExpenses();
  const { products } = useInventory();

  // Filter data by selected range
  const filteredInvoices = useMemo(
    () => filterByDateRange(invoices, (i) => i.createdAt, dateRange),
    [invoices, dateRange]
  );
  const filteredExpenses = useMemo(
    () => filterByDateRange(expenses, (e) => e.date, dateRange),
    [expenses, dateRange]
  );

  // Summary metrics
  const summary = useMemo(() => {
    const revenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const supplierCosts = suppliers.reduce((s, sp) => {
      if (dateRange === 'all') return s + (sp.totalPurchased || 0);
      const filteredPurchases = filterByDateRange(sp.purchases || [], (p) => p.date, dateRange);
      return s + filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    }, 0);
    const overheadExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = supplierCosts + overheadExpenses;
    const netProfit = revenue - totalExpenses;
    const clientReceivables = clients.reduce((s, c) => s + (c.remainingBalance || 0), 0);
    const supplierPayables = suppliers.reduce((s, sp) => s + (sp.totalOwed || 0), 0);
    const outstandingBalance = clientReceivables - supplierPayables;

    return { revenue, totalExpenses, netProfit, outstandingBalance };
  }, [filteredInvoices, filteredExpenses, dateRange, suppliers, clients]);

  // Monthly data for charts — always show all 12 months for this year
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = new Array(12).fill(0);
    const expensesByMonth = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      if (d.getFullYear() !== currentYear) return;
      revenueByMonth[d.getMonth()] += inv.total;
    });

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d.getFullYear() !== currentYear) return;
      expensesByMonth[d.getMonth()] += exp.amount;
    });

    suppliers.forEach((sp) => {
      (sp.purchases || []).forEach((p) => {
        const d = new Date(p.date);
        if (d.getFullYear() !== currentYear) return;
        expensesByMonth[d.getMonth()] += p.total;
      });
    });

    // Profit margin per month
    const profitMargin = months.map((_, i) => {
      const rev = revenueByMonth[i];
      return rev > 0 ? ((rev - expensesByMonth[i]) / rev) * 100 : 0;
    });

    return {
      categories: months,
      revenueSeries: revenueByMonth,
      expensesSeries: expensesByMonth,
      profitMargin,
    };
  }, [invoices, expenses, suppliers]);

  // ── PDF Preview (opens in new tab → browser prints to PDF) ──────────────
  const buildReportHtml = useCallback(() => {
    const isRTL = dir === 'rtl';
    const numLocale = language === 'ar' ? 'ar-DZ' : 'fr-DZ';
    const dateLocale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB';
    const fmt = (n: number) => `${Math.round(n).toLocaleString(numLocale)} DA`;
    const fmtDate = (dateStr: string) => { const d = new Date(dateStr); return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(dateLocale); };
    const localizedMonths = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(dateLocale, { month: 'short' }).format(new Date(2000, i, 1)));
    const pct = (n: number, of: number) => (of > 0 ? `${((n / of) * 100).toFixed(1)}%` : '0%');

    const statusBadge = (cls: string, label: string) =>
      `<span class="badge ${cls}">${label}</span>`;

    const salesRows = filteredInvoices
      .map(
        (inv) =>
          `<tr>
            <td>${inv.invoiceNumber}</td><td>${inv.client.name}</td><td>${fmtDate(inv.createdAt)}</td>
            <td class="num">${fmt(inv.total)}</td><td class="num">${fmt(inv.amountPaid)}</td>
            <td class="num">${fmt(inv.amountDue)}</td>
            <td class="ctr">${statusBadge(inv.status === 'paid' ? 'paid' : inv.status === 'partly-paid' ? 'partial' : 'unpaid', inv.status === 'paid' ? t('reports.paid') : inv.status === 'partly-paid' ? t('reports.partial') : t('reports.unpaid'))}</td>
          </tr>`
      )
      .join('');
    const salesTotals = [
      filteredInvoices.reduce((s, i) => s + i.total, 0),
      filteredInvoices.reduce((s, i) => s + i.amountPaid, 0),
      filteredInvoices.reduce((s, i) => s + i.amountDue, 0),
    ];

    const clientsSorted = [...clients].sort((a, b) => b.remainingBalance - a.remainingBalance);
    const clientRows = clientsSorted
      .map(
        (c) =>
          `<tr>
            <td>${c.name}</td><td>${c.phone}</td>
            <td class="num">${fmt(c.totalPurchases)}</td><td class="num">${fmt(c.totalPaid)}</td>
            <td class="num">${fmt(c.remainingBalance)}</td>
            <td class="ctr">${statusBadge(c.status === 'paid' ? 'paid' : 'unpaid', c.status === 'paid' ? t('reports.paid') : t('reports.unpaid'))}</td>
          </tr>`
      )
      .join('');
    const clientTotals = [
      clients.reduce((s, c) => s + c.totalPurchases, 0),
      clients.reduce((s, c) => s + c.totalPaid, 0),
      clients.reduce((s, c) => s + c.remainingBalance, 0),
    ];

    const suppliersSorted = [...suppliers].sort((a, b) => b.totalOwed - a.totalOwed);
    const supplierRows = suppliersSorted
      .map(
        (sp) =>
          `<tr>
            <td>${sp.name}</td><td>${sp.email}</td>
            <td class="num">${fmt(sp.totalPurchased)}</td><td class="num">${fmt(sp.totalPaid)}</td>
            <td class="num">${fmt(sp.totalOwed)}</td>
            <td class="ctr">${statusBadge(sp.totalOwed === 0 ? 'paid' : 'unpaid', sp.totalOwed === 0 ? t('reports.settled') : t('reports.owing'))}</td>
          </tr>`
      )
      .join('');
    const suppTotals = [
      suppliers.reduce((s, sp) => s + sp.totalPurchased, 0),
      suppliers.reduce((s, sp) => s + sp.totalPaid, 0),
      suppliers.reduce((s, sp) => s + sp.totalOwed, 0),
    ];

    const expCatMap2 = new Map<string, { total: number; count: number }>();
    filteredExpenses.forEach((e) => {
      const ex = expCatMap2.get(e.category);
      if (ex) { ex.total += e.amount; ex.count += 1; }
      else expCatMap2.set(e.category, { total: e.amount, count: 1 });
    });
    const expCats2 = Array.from(expCatMap2.entries()).sort((a, b) => b[1].total - a[1].total);
    const expGrandTotal2 = expCats2.reduce((s, [, v]) => s + v.total, 0);
    const expRows = expCats2
      .map(([label, v]) => `<tr><td>${label}</td><td class="ctr">${v.count}</td><td class="num">${fmt(v.total)}</td><td class="num">${pct(v.total, expGrandTotal2)}</td></tr>`)
      .join('');

    const invCatMap = new Map<string, { items: number; stock: number; cost: number; retail: number }>();
    products.forEach((p) => {
      const ex = invCatMap.get(p.category);
      if (ex) {
        ex.items += 1; ex.stock += p.stock;
        ex.cost += p.stock * p.buyingPrice; ex.retail += p.stock * p.sellPrice;
      } else {
        invCatMap.set(p.category, { items: 1, stock: p.stock, cost: p.stock * p.buyingPrice, retail: p.stock * p.sellPrice });
      }
    });
    const invCats = Array.from(invCatMap.entries()).sort((a, b) => b[1].retail - a[1].retail);
    const invTotals = invCats.reduce((acc, [, v]) => ({
      items: acc.items + v.items, stock: acc.stock + v.stock,
      cost: acc.cost + v.cost, retail: acc.retail + v.retail,
    }), { items: 0, stock: 0, cost: 0, retail: 0 });
    const invRows = invCats
      .map(([cat, v]) => `<tr><td>${cat}</td><td class="ctr">${v.items}</td><td class="ctr">${v.stock}</td><td class="num">${fmt(v.cost)}</td><td class="num">${fmt(v.retail)}</td><td class="num">${fmt(v.retail - v.cost)}</td></tr>`)
      .join('');

    const monthRows = localizedMonths
      .map((m, i) => `<tr><td>${m}</td><td class="num">${fmt(monthlyData.revenueSeries[i])}</td><td class="num">${fmt(monthlyData.expensesSeries[i])}</td><td class="num">${fmt(monthlyData.revenueSeries[i] - monthlyData.expensesSeries[i])}</td></tr>`)
      .join('');

    const section = (title: string, content: string, pageBreak = false) =>
      `<div class="section${pageBreak ? ' break' : ''}"><h2 class="sec-title">${title}</h2>${content}</div>`;

    const table = (head: string, body: string, foot = '') =>
      `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot ? `<tfoot><tr>${foot}</tr></tfoot>` : ''}</table>`;

    const th = (label: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''}>${label}</th>`;
    const tf = (val: string, cls = '') => `<td${cls ? ` class="${cls}"` : ''}><strong>${val}</strong></td>`;

    const html = `<!DOCTYPE html>
<html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${t('reports.title')} — ${dateRangeLabels[dateRange]}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;color:#212b36;font-size:12px;padding-bottom:64px}
    .page{background:#fff;max-width:1100px;margin:24px auto;box-shadow:0 2px 20px rgba(0,0,0,.12);border-radius:8px;overflow:hidden}
    .cover{background:linear-gradient(135deg,#1565c0 0%,#42a5f5 100%);padding:40px;color:#fff;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px}
    .cover h1{font-size:26px;font-weight:700;margin-bottom:6px}
    .cover p{font-size:13px;opacity:.85}
    .cover .meta{text-align:${isRTL ? 'start' : 'end'};font-size:12px;opacity:.8}
    .content{padding:32px 40px}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:8px}
    @media(max-width:700px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
    .kpi{padding:16px;border-radius:8px;border:1px solid #e0e0e0;text-align:center}
    .kpi .lbl{font-size:10px;color:#637381;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
    .kpi .val{font-size:17px;font-weight:700}
    .kpi.blue{border-color:#1976d2;background:#e3f2fd}.kpi.blue .val{color:#1565c0}
    .kpi.red{border-color:#d32f2f;background:#ffebee}.kpi.red .val{color:#c62828}
    .kpi.green{border-color:#388e3c;background:#e8f5e9}.kpi.green .val{color:#2e7d32}
    .kpi.orange{border-color:#f57c00;background:#fff3e0}.kpi.orange .val{color:#e65100}
    .section{margin-bottom:32px}
    .break{page-break-before:always;padding-top:24px}
    .sec-title{font-size:14px;font-weight:600;color:#1565c0;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #1565c0}
    table{width:100%;border-collapse:collapse;font-size:11px}
    thead th{background:#1565c0;color:#fff;padding:8px 10px;font-weight:600}
    thead th.num{text-align:${isRTL ? 'start' : 'end'}}
    thead th.ctr{text-align:center}
    tbody td{padding:7px 10px;border-bottom:1px solid #f0f0f0}
    tbody tr:nth-child(even){background:#fafafa}
    tbody td.num{text-align:${isRTL ? 'start' : 'end'}}
    tbody td.ctr{text-align:center}
    tfoot td{padding:8px 10px;border-top:2px solid #90caf9;background:#e3f2fd}
    tfoot td.num{text-align:${isRTL ? 'start' : 'end'}}
    .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
    .badge.paid{background:#e8f5e9;color:#2e7d32}
    .badge.unpaid{background:#ffebee;color:#c62828}
    .badge.partial{background:#fff3e0;color:#e65100}
    .print-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e0e0e0;padding:12px 24px;display:flex;gap:12px;justify-content:flex-end;box-shadow:0 -2px 8px rgba(0,0,0,.1);z-index:99}
    .btn{padding:10px 24px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600}
    .btn-primary{background:#1565c0;color:#fff}
    .btn-secondary{background:#f5f5f5;color:#637381;border:1px solid #e0e0e0}
    .btn-outline{background:#fff;color:#1565c0;border:1px solid #1565c0}
    @media print{
      body{background:#fff;padding-bottom:0}
      .page{box-shadow:none;margin:0;border-radius:0;max-width:100%}
      .cover,.kpi,.badge{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      thead th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      tfoot td{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .print-bar{display:none}
    }
  </style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div>
      <h1>${t('reports.title')}</h1>
      <p>${dateRangeLabels[dateRange]}</p>
    </div>
    <div class="meta">
      <p>${t('common.date')}: ${new Date().toLocaleDateString(dateLocale)}</p>
    </div>
  </div>
  <div class="content">
    ${section(
      '',
      `<div class="kpi-grid">
        <div class="kpi blue"><div class="lbl">${t('reports.totalRevenue')}</div><div class="val">${fmt(summary.revenue)}</div></div>
        <div class="kpi red"><div class="lbl">${t('reports.totalExpenses')}</div><div class="val">${fmt(summary.totalExpenses)}</div></div>
        <div class="kpi ${summary.netProfit >= 0 ? 'green' : 'red'}"><div class="lbl">${t('reports.netProfit')}</div><div class="val">${fmt(summary.netProfit)}</div></div>
        <div class="kpi orange"><div class="lbl">${t('reports.outstandingBalance')}</div><div class="val">${fmt(summary.outstandingBalance)}</div></div>
      </div>`
    )}
    ${section(t('reports.revenueVsExpenses'), table(
      th(t('common.month')) + th(t('reports.revenue'), 'num') + th(t('reports.expenses'), 'num') + th(t('reports.netProfit'), 'num'),
      monthRows
    ))}
    ${section(t('reports.salesReport'), table(
      th(t('reports.invoiceNumber')) + th(t('reports.client')) + th(t('common.date')) + th(t('common.total'), 'num') + th(t('reports.paid'), 'num') + th(t('reports.due'), 'num') + th(t('common.status'), 'ctr'),
      salesRows,
      tf(`${t('common.total')} (${filteredInvoices.length})`) + tf('') + tf('') + tf(fmt(salesTotals[0]), 'num') + tf(fmt(salesTotals[1]), 'num') + tf(fmt(salesTotals[2]), 'num') + tf('')
    ), true)}
    ${section(t('reports.clientBalances'), table(
      th(t('reports.client')) + th(t('common.phone')) + th(t('reports.totalPurchases'), 'num') + th(t('reports.totalPaid'), 'num') + th(t('reports.remaining'), 'num') + th(t('common.status'), 'ctr'),
      clientRows,
      tf(`${t('common.total')} (${clients.length})`) + tf('') + tf(fmt(clientTotals[0]), 'num') + tf(fmt(clientTotals[1]), 'num') + tf(fmt(clientTotals[2]), 'num') + tf('')
    ), true)}
    ${section(t('reports.supplierBalances'), table(
      th(t('reports.supplier')) + th(t('common.email')) + th(t('reports.totalPurchased'), 'num') + th(t('reports.totalPaid'), 'num') + th(t('reports.owed'), 'num') + th(t('common.status'), 'ctr'),
      supplierRows,
      tf(`${t('common.total')} (${suppliers.length})`) + tf('') + tf(fmt(suppTotals[0]), 'num') + tf(fmt(suppTotals[1]), 'num') + tf(fmt(suppTotals[2]), 'num') + tf('')
    ), true)}
    ${section(t('reports.expenses'), table(
      th(t('common.category')) + th(t('reports.transactions'), 'ctr') + th(t('common.total'), 'num') + th(t('reports.percentOfTotal'), 'num'),
      expRows,
      tf(t('reports.grandTotal')) + tf(String(filteredExpenses.length), 'ctr') + tf(fmt(expGrandTotal2), 'num') + tf('100%', 'num')
    ), true)}
    ${section(t('reports.inventoryValuation'), table(
      th(t('common.category')) + th(t('reports.products'), 'ctr') + th(t('reports.totalStock'), 'ctr') + th(t('reports.costValue'), 'num') + th(t('reports.retailValue'), 'num') + th(t('reports.potentialProfit'), 'num'),
      invRows,
      tf(t('common.total')) + tf(String(invTotals.items), 'ctr') + tf(String(invTotals.stock), 'ctr') + tf(fmt(invTotals.cost), 'num') + tf(fmt(invTotals.retail), 'num') + tf(fmt(invTotals.retail - invTotals.cost), 'num')
    ), true)}
  </div>
</div>
</body>
</html>`;

    return html;
  }, [t, language, dir, dateRange, dateRangeLabels, summary, monthlyData, filteredInvoices, filteredExpenses, clients, suppliers, products]);

  const handlePrintPdf = useCallback(() => {
    const printBar = `<div class="print-bar">
  <button class="btn btn-secondary" onclick="window.close()">${t('common.cancel')}</button>
  <button class="btn btn-primary" onclick="window.print()">${t('common.print')}</button>
</div>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildReportHtml().replace('</body>', printBar + '</body>'));
    win.document.close();
  }, [buildReportHtml, t]);

  const handleSavePdf = useCallback(() => {
    const html = buildReportHtml();
    const db = (window as any).database;
    if (db?.savePdf) {
      db.savePdf(html, 'reports');
    } else {
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }, [buildReportHtml]);

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 3, md: 5 },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4">{t('reports.title')}</Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            sx={{ minWidth: 160 }}
          >
            {DATE_RANGE_VALUES.map((value) => (
              <MenuItem key={value} value={value}>
                {dateRangeLabels[value]}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
            onClick={handlePrintPdf}
          >
            {t('common.print')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:document-bold-duotone" width={20} />}
            onClick={handleSavePdf}
          >
            {t('common.saveAsPdf')}
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <ReportsSummaryCards
          revenue={summary.revenue}
          totalExpenses={summary.totalExpenses}
          netProfit={summary.netProfit}
          outstandingBalance={summary.outstandingBalance}
        />
      </Box>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ReportsRevenueExpensesChart
            title={t('reports.revenueVsExpenses')}
            subheader={t('reports.monthlyComparison')}
            chart={{
              categories: monthlyData.categories,
              series: [
                { name: t('reports.revenue'), data: monthlyData.revenueSeries },
                { name: t('reports.expenses'), data: monthlyData.expensesSeries },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ReportsProfitMarginChart
            title={t('reports.profitMargin')}
            subheader={t('reports.monthlyTrend')}
            chart={{
              categories: monthlyData.categories,
              series: monthlyData.profitMargin,
            }}
          />
        </Grid>
      </Grid>

      {/* Breakdown Tabs */}
      <ReportsBreakdownTabs
        invoices={filteredInvoices}
        clients={clients}
        suppliers={suppliers}
        expenses={filteredExpenses}
        inventory={products}
      />
    </DashboardContent>
  );
}
