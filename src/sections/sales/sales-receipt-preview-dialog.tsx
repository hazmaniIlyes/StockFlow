import type { Invoice } from 'src/_mock/_data';
import type { BusinessInfo } from 'src/contexts/business-context';

import { useState, useEffect, useMemo } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';

import { useInvoices } from './context';

// ── Build the receipt HTML ────────────────────────────────────────────

export function buildReceiptHtml(invoice: Invoice, business: BusinessInfo, language: string, showPaymentStatus: boolean = false, clientTotalDebt?: number): string {
  const isAr = language === 'ar';
  const locale = isAr ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en';
  const currency = isAr ? 'دج' : 'DA';
  const dir = isAr ? 'rtl' : 'ltr';
  const now = new Date();
  const date = now.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Table column alignments flip in RTL
  const nameAlign  = isAr ? 'right' : 'left';
  const priceAlign = isAr ? 'left'  : 'right';

  const productRows = invoice.products
    .map(
      (p) =>
        `<tr>
          <td style="text-align:${nameAlign};padding:2px 0">${p.name}</td>
          <td style="text-align:center;padding:2px 4px">${p.quantity}</td>
          <td style="text-align:${priceAlign};padding:2px 0">${p.unitPrice.toLocaleString(locale)} ${currency}</td>
          <td style="text-align:${priceAlign};padding:2px 0">${(p.quantity * p.unitPrice).toLocaleString(locale)} ${currency}</td>
        </tr>`
    )
    .join('');

  const clientLabel   = isAr ? 'العميل'  : language === 'fr' ? 'Client'  : 'Client';
  const telLabel      = isAr ? 'هاتف'    : language === 'fr' ? 'Tél'     : 'Tel';
  const addressLabel  = isAr ? 'العنوان' : language === 'fr' ? 'Adresse' : 'Address';
  const paidLabel      = isAr ? 'المبلغ المدفوع'      : language === 'fr' ? 'Montant payé'       : 'Amount Paid';
  const dueLabel       = isAr ? 'المبلغ المستحق'      : language === 'fr' ? 'Montant dû'         : 'Amount Due';
  const totalDebtLabel = isAr ? 'إجمالي الديون المستحقة' : language === 'fr' ? 'Total dû (global)'  : 'Total Outstanding Debt';
  const footerText    = isAr ? '!شكراً لزيارتكم' : language === 'fr' ? 'Merci pour votre achat !' : 'Thank you for your purchase!';

  // Arabic column headers
  const thArticle = isAr ? 'الصنف'   : 'Article';
  const thQty     = isAr ? 'الكمية'  : 'Qté';
  const thPU      = isAr ? 'السعر'   : 'P.U';
  const thTotal   = isAr ? 'المجموع' : 'Total';

  const isWalkIn = !invoice.client?.name
    || invoice.client.name === 'Walk-in Customer'
    || invoice.client.name === 'Client de passage'
    || invoice.client.name === 'زبون عابر';

  return `<!DOCTYPE html>
<html lang="${language}" dir="${dir}">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${isAr ? "'Arial', 'Tahoma', sans-serif" : "'Consolas', 'Courier New', monospace"};
    font-size: 12px;
    color: #000;
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
    padding: 4px 0;
    background: #fff;
    direction: ${dir};
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .shop-name { font-size: 16px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: ${nameAlign}; font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; }
  th:nth-child(2) { text-align: center; }
  th:nth-child(3), th:nth-child(4) { text-align: ${priceAlign}; }
  .total-row { font-size: 14px; font-weight: bold; }
  .footer { font-size: 10px; margin-top: 8px; }
</style>
</head>
<body>

<div class="center">
  <div class="shop-name">${business.businessName || ''}</div>
  ${business.address ? `<div>${business.address}</div>` : ''}
  ${business.phone ? `<div>${telLabel}: ${business.phone}</div>` : ''}
  ${business.nif ? `<div>NIF: ${business.nif}</div>` : ''}
  ${business.rc ? `<div>RC: ${business.rc}</div>` : ''}
</div>

<hr class="divider" />

<div style="display:flex;justify-content:space-between">
  <span>${isAr ? time : date}</span>
  <span>${isAr ? date : time}</span>
</div>
<div style="margin-bottom:4px">
  <span class="bold">N°:</span> ${invoice.invoiceNumber}
</div>

<hr class="divider" />

${!isWalkIn ? `
<div style="margin-bottom:4px">
  <span class="bold">${clientLabel}:</span> ${invoice.client.name}
</div>
${invoice.client.phone ? `<div style="margin-bottom:2px"><span class="bold">${telLabel}:</span> ${invoice.client.phone}</div>` : ''}
${invoice.client.address ? `<div style="margin-bottom:4px"><span class="bold">${addressLabel}:</span> ${invoice.client.address}</div>` : ''}
<hr class="divider" />
` : ''}

<table>
  <thead>
    <tr>
      <th>${thArticle}</th>
      <th>${thQty}</th>
      <th>${thPU}</th>
      <th>${thTotal}</th>
    </tr>
  </thead>
  <tbody>
    ${productRows}
  </tbody>
</table>

<hr class="divider" />

<table>
  <tr class="total-row">
    <td>TOTAL</td>
    <td style="text-align:${priceAlign}">${invoice.total.toLocaleString(locale)} ${currency}</td>
  </tr>
</table>

${showPaymentStatus ? `
<table>
  <tr style="font-size: 13px;">
    <td>${paidLabel}</td>
    <td style="text-align:${priceAlign}">${invoice.amountPaid.toLocaleString(locale)} ${currency}</td>
  </tr>
  ${invoice.amountDue > 0 ? `
  <tr style="font-size: 13px; font-weight: bold;">
    <td>${dueLabel}</td>
    <td style="text-align:${priceAlign}">${invoice.amountDue.toLocaleString(locale)} ${currency}</td>
  </tr>
  ` : ''}
  ${(clientTotalDebt !== undefined && clientTotalDebt > 0) ? `
  <tr style="font-size: 12px; font-weight: bold; border-top: 1px solid #000;">
    <td style="padding-top:4px">${totalDebtLabel}</td>
    <td style="text-align:${priceAlign};padding-top:4px">${clientTotalDebt.toLocaleString(locale)} ${currency}</td>
  </tr>
  ` : ''}
</table>
` : ''}

<hr class="divider" />

<div class="center footer">
  ${footerText}<br/>
  ─────────────────────
</div>

</body>
</html>`;
}

// ── Receipt preview dialog ────────────────────────────────────────────


type Props = {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  businessInfo: BusinessInfo;
  showPaymentStatus?: boolean;
};

export function SalesReceiptPreviewDialog({ open, onClose, invoice, businessInfo, showPaymentStatus = false }: Props) {
  const { language, t } = useTranslation();
  const { invoices } = useInvoices();
  const [receiptPrinter, setReceiptPrinter] = useState<string | null>(null);

  // Total outstanding debt for this client across ALL their invoices
  const clientTotalDebt = useMemo(() => {
    if (!invoice?.client?.name || !showPaymentStatus) return undefined;
    const clientName = invoice.client.name;
    if (
      clientName === 'Walk-in Customer' ||
      clientName === 'Client de passage' ||
      clientName === 'زبون عابر'
    ) return undefined;

    // Sum existing invoices from state
    const fromState = invoices
      .filter((inv) => inv.client?.name === clientName && (inv.amountDue ?? 0) > 0)
      .reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);

    // If current invoice not yet in state (async update), add its amountDue manually
    const alreadyInState = invoices.some((inv) => inv.id === invoice.id);
    const currentDue = !alreadyInState ? (invoice.amountDue ?? 0) : 0;

    const total = fromState + currentDue;
    return total > 0 ? total : undefined;
  }, [invoice, invoices, showPaymentStatus]);

  useEffect(() => {
    if (!open) return;
    window.database?.getSetting('receipt_printer').then((val) => {
      if (val) setReceiptPrinter(val);
    });
  }, [open]);

  if (!invoice) return null;

  const htmlContent = buildReceiptHtml(invoice, businessInfo, language, showPaymentStatus, clientTotalDebt);

  const handlePrint = () => {
    if (receiptPrinter && receiptPrinter !== 'none') {
      window.database?.printHtmlSilent(htmlContent, receiptPrinter);
    } else {
      window.database?.printHtml(htmlContent);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: 400,
          height: '80vh',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#616161',
        },
      }}
    >
      <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto', bgcolor: '#616161', display: 'flex', justifyContent: 'center' }}>
        <iframe
          key={htmlContent}
          srcDoc={htmlContent}
          style={{
            width: 320,
            minHeight: 500,
            border: 'none',
            display: 'block',
            background: '#fff',
            margin: '16px 0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
          title="Receipt Preview"
          onLoad={(e) => {
            const doc = e.currentTarget.contentDocument;
            if (doc) {
              const h = doc.documentElement.scrollHeight;
              if (h > 0) e.currentTarget.style.height = `${h}px`;
            }
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ ml: 'auto' }}>
          {t('common.close')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:printer-bold-duotone" width={18} />}
          onClick={handlePrint}
        >
          {t('sales.printReceipt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
