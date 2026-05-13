import type { Invoice } from 'src/_mock/_data';
import type { BusinessInfo } from 'src/contexts/business-context';

import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';
import { useTranslation } from 'src/contexts';

// ── Build the receipt HTML ────────────────────────────────────────────

export function buildReceiptHtml(invoice: Invoice, business: BusinessInfo, language: string): string {
  const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en';
  const currency = language === 'ar' ? 'دج' : 'DA';
  const now = new Date();
  const date = now.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const productRows = invoice.products
    .map(
      (p) =>
        `<tr>
          <td style="text-align:left;padding:2px 0">${p.name}</td>
          <td style="text-align:center;padding:2px 4px">${p.quantity}</td>
          <td style="text-align:right;padding:2px 0">${p.unitPrice.toLocaleString(locale)} ${currency}</td>
          <td style="text-align:right;padding:2px 0">${(p.quantity * p.unitPrice).toLocaleString(locale)} ${currency}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    color: #000;
    width: 300px;
    margin: 0 auto;
    padding: 12px 8px;
    background: #fff;
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
  th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; }
  th:nth-child(2) { text-align: center; }
  th:nth-child(3), th:nth-child(4) { text-align: right; }
  .total-row { font-size: 14px; font-weight: bold; }
  .footer { font-size: 10px; margin-top: 8px; }
</style>
</head>
<body>

<div class="center">
  <div class="shop-name">${business.businessName || ''}</div>
  ${business.address ? `<div>${business.address}</div>` : ''}
  ${business.phone ? `<div>Tél: ${business.phone}</div>` : ''}
  ${business.nif ? `<div>NIF: ${business.nif}</div>` : ''}
  ${business.rc ? `<div>RC: ${business.rc}</div>` : ''}
</div>

<hr class="divider" />

<div style="display:flex;justify-content:space-between">
  <span>${date}</span>
  <span>${time}</span>
</div>
<div style="margin-bottom:4px">
  <span class="bold">N°:</span> ${invoice.invoiceNumber}
</div>

<hr class="divider" />

<table>
  <thead>
    <tr>
      <th>Article</th>
      <th>Qté</th>
      <th>P.U</th>
      <th>Total</th>
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
    <td style="text-align:right">${invoice.total.toLocaleString(locale)} ${currency}</td>
  </tr>
</table>

<hr class="divider" />

<div class="center footer">
  Merci pour votre achat !<br/>
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
};

export function SalesReceiptPreviewDialog({ open, onClose, invoice, businessInfo }: Props) {
  const { language, t } = useTranslation();
  const [receiptPrinter, setReceiptPrinter] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    window.database?.getSetting('receipt_printer').then((val) => {
      if (val) setReceiptPrinter(val);
    });
  }, [open]);

  if (!invoice) return null;

  const htmlContent = buildReceiptHtml(invoice, businessInfo, language);

  const handlePrint = () => {
    if (receiptPrinter) {
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
