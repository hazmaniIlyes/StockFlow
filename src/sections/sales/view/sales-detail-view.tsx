import type { Invoice, InvoiceProduct } from 'src/_mock/_data';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fCurrency } from 'src/utils/format-number';
import { fDateLocale } from 'src/utils/format-time';
import { numberToWords } from 'src/utils/number-to-words';

import { DashboardContent } from 'src/layouts/dashboard';
import { useClients, useBusiness, useInventory, useTranslation } from 'src/contexts';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { useInvoices } from '../context';
import { SalesNewInvoiceDialog } from '../sales-new-invoice-dialog';
import { buildReceiptHtml } from '../sales-receipt-preview-dialog';
import { SalesPrintPreviewDialog } from '../sales-print-preview-dialog';
import { SalesRecordPaymentDialog } from '../sales-record-payment-dialog';

// ======================================================================

export function SalesDetailView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useSnackbar();
  const { businessInfo } = useBusiness();
  const { t, language, dir } = useTranslation();
  const { invoices, getInvoice, updateInvoice, deleteInvoice, recordPayment, markAsPaid } = useInvoices();
  const { restoreStockForInvoice, deductStockForInvoice, canDeductAfterRestore, products: inventoryProducts } = useInventory();
  const { getClientByName, recordPayment: recordClientPayment, updateClient, addClient } = useClients();

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'invoice' | 'delivery' | 'receipt'>('invoice');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Total outstanding debt for this client across all their invoices
  const clientTotalDebt = useMemo(() => {
    if (!invoice?.client?.name) return undefined;
    const clientName = invoice.client.name;
    if (
      clientName === 'Walk-in Customer' ||
      clientName === 'Client de passage' ||
      clientName === 'زبون عابر'
    ) return undefined;
    const total = invoices
      .filter((inv) => inv.client?.name === clientName && (inv.amountDue ?? 0) > 0)
      .reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);
    return total > 0 ? total : undefined;
  }, [invoice, invoices]);

  const theme = useTheme();
  const accentColor = theme.palette.primary.main;

  // Fetch invoice from context whenever id changes
  useEffect(() => {
    if (id) {
      setInvoice(getInvoice(id));
    }
  }, [id, getInvoice]);

  const shouldPrint = searchParams.get('print') === 'true';
  const printMode = searchParams.get('printMode') as 'invoice' | 'delivery' | 'receipt' | null;
  const [pendingPrint, setPendingPrint] = useState(false);

  // Handle legacy ?print=true
  useEffect(() => {
    if (shouldPrint && invoice) {
      const timerId = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timerId);
    }
    return undefined;
  }, [shouldPrint, invoice]);

  // Handle ?printMode=invoice|delivery — set view mode then trigger popup print
  useEffect(() => {
    if (printMode && invoice) {
      setViewMode(printMode);
      setPendingPrint(true);
    }
  }, [printMode, invoice]);

  const buildHtml = useCallback(() => {
    if (!invoice) return '';

    const accent = '#1a1a1a';
    const isRtl = dir === 'rtl';
    const isInvoice = viewMode === 'invoice';

    if (viewMode === 'receipt') {
      return buildReceiptHtml(invoice, businessInfo, language, true, clientTotalDebt);
    }

    // ── DELIVERY NOTE HTML ──────────────────────────────────────────────
    if (!isInvoice) {
      const clientRecord = getClientByName(invoice.client.name);
      const ancienSolde = clientRecord ? Math.max(0, clientRecord.remainingBalance - invoice.amountDue) : 0;
      const nouveauSolde = clientRecord ? clientRecord.remainingBalance : invoice.amountDue;
      const numericPart2 = invoice.invoiceNumber.replace(/^[A-Z]+-/, '');
      const blPrefix = language === 'fr' ? 'BL' : language === 'ar' ? 'وصل تسليم' : 'DN';
      const blNumber = `${blPrefix}-${numericPart2}`;
      const blTitle = language === 'fr' ? 'Bon de livraison' : language === 'ar' ? 'وصل تسليم' : 'Delivery Note';
      const dateStr = fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en');
      const lbl = {
        client:       language === 'fr' ? 'Client'          : language === 'ar' ? 'العميل'           : 'Client',
        date:         language === 'fr' ? 'Date'            : language === 'ar' ? 'التاريخ'          : 'Date',
        code:         language === 'fr' ? 'Code'            : language === 'ar' ? 'الرمز'            : 'Code',
        product:      language === 'fr' ? 'Produit'         : language === 'ar' ? 'المنتج'           : 'Product',
        unitPrice:    language === 'fr' ? 'P.Unite'         : language === 'ar' ? 'سعر الوحدة'       : 'Unit Price',
        qty:          language === 'fr' ? 'QTE'             : language === 'ar' ? 'الكمية'           : 'QTY',
        total:        language === 'fr' ? 'Total'           : language === 'ar' ? 'المجموع'          : 'Total',
        ancienSolde:  language === 'fr' ? 'Ancien Solde'    : language === 'ar' ? 'الرصيد السابق'    : 'Previous Balance',
        payer:        language === 'fr' ? 'Payer'           : language === 'ar' ? 'المدفوع'          : 'Paid',
        nouveauSolde: language === 'fr' ? 'Nouveau Solde'   : language === 'ar' ? 'الرصيد الجديد'    : 'New Balance',
        remise:       language === 'fr' ? 'Remise'          : language === 'ar' ? 'الخصم'            : 'Discount',
        aPayer:       language === 'fr' ? 'A Payer'         : language === 'ar' ? 'المبلغ المستحق'   : 'Amount Due',
        sigLivreur:   language === 'fr' ? 'Signature Livreur' : language === 'ar' ? 'توقيع المسلّم' : 'Delivery Signature',
        sigClient:    language === 'fr' ? 'Signature Client'  : language === 'ar' ? 'توقيع العميل'  : 'Client Signature',
        nomSig:       language === 'fr' ? 'Nom & Signature'   : language === 'ar' ? 'الاسم والتوقيع' : 'Name & Signature',
      };
      const blTvaMultiplier = 1 + (invoice.tvaRate || 0) / 100;
      const blRows = invoice.products.map((p, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #f0f0f0">
          <td style="padding:9px 10px;font-size:0.7rem;color:#bbb;font-weight:700;width:32px;text-align:center">${String(i + 1).padStart(2, '0')}</td>
          <td style="padding:9px 10px;font-size:0.8rem;font-weight:600;color:#1a1a1a">${p.name}</td>
          <td style="padding:9px 10px;font-size:0.78rem;text-align:center;color:#333">${fCurrency(p.unitPrice * blTvaMultiplier)}</td>
          <td style="padding:9px 10px;font-size:0.78rem;text-align:center;color:#333">${p.quantity}${p.unit && p.unit !== 'pcs' ? ` ${p.unit}` : ''}</td>
          <td style="padding:9px 10px;font-size:0.78rem;text-align:right;font-weight:700;color:#1a1a1a">${fCurrency(p.total * blTvaMultiplier)}</td>
        </tr>`).join('');
      const blLogoHtml = businessInfo.logo
        ? `<img src="${businessInfo.logo}" alt="logo" style="height:48px;max-width:130px;object-fit:contain">`
        : `<div style="font-size:1rem;font-weight:800;color:#1a1a1a">${businessInfo.businessName || ''}</div>`;
      return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${language}"><head><meta charset="utf-8"><title>${blNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800${language === 'ar' ? '&family=Cairo:wght@400;600;700;800' : ''}&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { background:#616161; }
  body { font-family:${language === 'ar' ? "'Cairo', Arial, sans-serif" : "'Inter', 'Segoe UI', Arial, sans-serif"}; color:#1a1a1a; background:transparent; width:794px; margin:0 auto; direction:${isRtl ? 'rtl' : 'ltr'}; }
  .page { background:white; padding:28px 40px 32px; min-height:1122px; display:flex; flex-direction:column; }
  @media print { html { background:white; } @page { margin:0; size:A4; } body { width:100%; } }
</style></head>
<body>
<div class="page">
  <!-- top bar: logo left, company info right -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
    <div>${blLogoHtml}</div>
    <div style="text-align:${isRtl ? 'left' : 'right'}">
      ${businessInfo.businessName ? `<div style="font-size:0.82rem;font-weight:700;color:#1a1a1a">${businessInfo.businessName}</div>` : ''}
      ${businessInfo.phone ? `<div style="font-size:0.72rem;color:#555">${businessInfo.phone}</div>` : ''}
      ${businessInfo.address ? `<div style="font-size:0.72rem;color:#555">${businessInfo.address}</div>` : ''}
    </div>
  </div>
  <!-- centered title -->
  <div style="text-align:center;border-top:2px solid #1a1a1a;border-bottom:2px solid #1a1a1a;padding:10px 0;margin-bottom:16px">
    <div style="font-size:1.3rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a">${blTitle} N°: ${blNumber}</div>
  </div>
  <!-- client + date info row -->
  <div style="display:flex;justify-content:space-between;margin-bottom:14px;gap:16px">
    <div>
      <div style="font-size:0.78rem;color:#333"><strong>${lbl.client}:</strong> ${invoice.client.name}</div>
      ${invoice.client.phone ? `<div style="font-size:0.75rem;color:#555">${invoice.client.phone}</div>` : ''}
      ${invoice.client.address ? `<div style="font-size:0.75rem;color:#555">${invoice.client.address}</div>` : ''}
    </div>
    <div style="text-align:${isRtl ? 'left' : 'right'}">
      <div style="font-size:0.78rem;color:#333"><strong>${lbl.date}:</strong> ${dateStr}</div>
      <div style="font-size:0.78rem;color:#333"><strong>${lbl.code}:</strong> #${numericPart2}</div>
    </div>
  </div>
  <!-- products table -->
  <div style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#1a1a2e;color:white">
          <th style="padding:9px 10px;font-size:0.68rem;font-weight:600;text-align:center;width:32px">N</th>
          <th style="padding:9px 10px;font-size:0.68rem;font-weight:600;text-align:left">${lbl.product}</th>
          <th style="padding:9px 10px;font-size:0.68rem;font-weight:600;text-align:center;width:100px">${lbl.unitPrice}</th>
          <th style="padding:9px 10px;font-size:0.68rem;font-weight:600;text-align:center;width:80px">${lbl.qty}</th>
          <th style="padding:9px 10px;font-size:0.68rem;font-weight:600;text-align:right;width:110px">${lbl.total}</th>
        </tr>
      </thead>
      <tbody>${blRows}</tbody>
    </table>
  </div>
  <!-- bottom: totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
    <div style="min-width:230px">
      <div style="background:#1a1a2e;color:white;padding:10px 16px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.8rem;font-weight:700;text-transform:uppercase">${lbl.total}</span>
        <span style="font-size:1rem;font-weight:800">${fCurrency(invoice.total)}</span>
      </div>
      <div style="border:1px solid #e0e0e0;border-top:none;padding:7px 16px;display:flex;justify-content:space-between;background:#f8f9fa;border-radius:0 0 6px 6px">
        <span style="font-size:0.8rem;font-weight:700;color:#1a1a1a">${lbl.aPayer}:</span>
        <span style="font-size:0.8rem;font-weight:800;color:#1a1a1a">${fCurrency(invoice.amountDue)}</span>
      </div>
    </div>
  </div>
</div>
</body></html>`;
    }
    // ── END DELIVERY NOTE ────────────────────────────────────────────────
    const PRODUCTS_PER_PAGE = 10;

    const docTitle = isInvoice
      ? (t('sales.invoiceNumber').replace('#', '').trim() || 'FACTURE').toUpperCase()
      : (t('sales.bonDeLivraison') || 'BON DE LIVRAISON').toUpperCase();
    const numericPart = invoice.invoiceNumber.replace(/^[A-Z]+-/, '');
    const invoicePrefix = language === 'fr' ? 'FAC' : language === 'ar' ? 'فاتورة' : 'INV';
    const deliveryPrefix = language === 'fr' ? 'BL' : language === 'ar' ? 'وصل تسليم' : 'DN';
    const docNumber = isInvoice
      ? `${invoicePrefix}-${numericPart}`
      : `${deliveryPrefix}-${numericPart}`;

    // Chunk products into pages of 10
    const chunks: (typeof invoice.products)[] = [];
    for (let i = 0; i < invoice.products.length; i += PRODUCTS_PER_PAGE) {
      chunks.push(invoice.products.slice(i, i + PRODUCTS_PER_PAGE));
    }
    const totalPages = chunks.length;

    const logoHtml = businessInfo.logo
      ? `<img src="${businessInfo.logo}" alt="logo" style="height:60px;max-width:160px;object-fit:contain">`
      : `<div style="font-size:1.15rem;font-weight:800;letter-spacing:-0.5px;color:#1a1a1a">${businessInfo.businessName || 'Your Company'}</div>`;

    const infoRow = (label: string, value: string) =>
      `<div style="display:flex;gap:6px;margin-bottom:2px">
        <span style="font-size:0.68rem;color:#aaa;min-width:28px;padding-top:1px">${label}</span>
        <span style="font-size:0.72rem;color:#444">${value}</span>
      </div>`;

    const fromLines = [
      businessInfo.businessName ? `<div style="font-weight:700;font-size:0.85rem;color:#1a1a1a;margin-bottom:6px">${businessInfo.businessName}</div>` : '',
      businessInfo.address ? infoRow('📍', businessInfo.address) : '',
      businessInfo.phone   ? infoRow('📞', businessInfo.phone) : '',
      businessInfo.email   ? infoRow('✉', businessInfo.email) : '',
      businessInfo.nif     ? infoRow('NIF', businessInfo.nif) : '',
      businessInfo.nis     ? infoRow('NIS', businessInfo.nis) : '',
      businessInfo.rc      ? infoRow('RC', businessInfo.rc) : '',
      businessInfo.ai      ? infoRow('AI', businessInfo.ai) : '',
    ].filter(Boolean).join('');

    const toLines = [
      `<div style="font-weight:700;font-size:0.85rem;color:#1a1a1a;margin-bottom:6px">${invoice.client.name}</div>`,
      invoice.client.phone   ? infoRow('📞', invoice.client.phone) : '',
      invoice.client.address ? infoRow('📍', invoice.client.address) : '',
      invoice.client.nif     ? infoRow('NIF', invoice.client.nif) : '',
      invoice.client.nis     ? infoRow('NIS', invoice.client.nis) : '',
      invoice.client.rc      ? infoRow('RC', invoice.client.rc) : '',
      invoice.client.ai      ? infoRow('AI', invoice.client.ai) : '',
    ].filter(Boolean).join('');

    const priceColsHeader = isInvoice ? `
      <th style="color:white;padding:10px 12px;text-align:right;width:115px;font-size:0.7rem;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${t('common.price') || 'Prix unitaire'}</th>
      <th style="color:white;padding:10px 12px;text-align:right;width:115px;font-size:0.7rem;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${t('common.total') || 'Total'}</th>` : '';

    const buildRows = (products: typeof invoice.products, startIndex: number) =>
      products.map((p, i) => {
        const globalIndex = startIndex + i;
        const isEven = i % 2 === 0;
        const priceCols = isInvoice ? `
          <td style="text-align:right;padding:10px 12px;color:#555;font-size:0.8rem">${fCurrency(p.unitPrice)}</td>
          <td style="text-align:right;padding:10px 12px;font-weight:700;font-size:0.8rem;color:#1a1a1a">${fCurrency(p.total)}</td>` : '';
        return `<tr style="background:${isEven ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 12px;font-size:0.68rem;color:#bbb;font-weight:700;width:36px">${String(globalIndex + 1).padStart(2, '0')}</td>
          <td style="padding:10px 12px;font-weight:600;font-size:0.82rem;color:#1a1a1a">${p.name}</td>
          <td style="text-align:center;padding:10px 12px;font-size:0.8rem;color:#333;width:80px">${p.quantity}${p.unit && p.unit !== 'pcs' ? ` ${p.unit}` : ''}</td>
          ${priceCols}
        </tr>`;
      }).join('');

    const buildTable = (rows: string) => `
      <div style="border-radius:8px;overflow:hidden;border:1px solid #e8e8e8;margin-bottom:20px;margin-top:16px">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
          <thead>
            <tr style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)">
              <th style="color:rgba(255,255,255,0.5);padding:10px 12px;text-align:left;width:36px;font-size:0.65rem;font-weight:600;letter-spacing:1px">#</th>
              <th style="color:white;padding:10px 12px;text-align:left;font-size:0.7rem;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${t('common.product') || 'Désignation'}</th>
              <th style="color:white;padding:10px 12px;text-align:center;width:80px;font-size:0.7rem;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${t('common.quantity') || 'Qté'}</th>
              ${priceColsHeader}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    const totalsHtml = isInvoice ? `
      <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
        <div style="width:300px">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">
            <span style="font-size:0.75rem;color:#888">${t('common.subtotal') || 'Sous-total'} HT</span>
            <span style="font-size:0.78rem;font-weight:600;color:#333">${fCurrency(invoice.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">
            <span style="font-size:0.75rem;color:#888">TVA (${invoice.tvaRate}%)</span>
            <span style="font-size:0.78rem;font-weight:600;color:#333">${fCurrency(invoice.tvaAmount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:${accent};border-radius:6px;margin-top:8px">
            <span style="font-size:0.82rem;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.5px">${t('common.total') || 'Total'} TTC</span>
            <span style="font-size:1.05rem;font-weight:800;color:white">${fCurrency(invoice.total)}</span>
          </div>
          ${invoice.status !== 'paid' ? `
          <div style="display:flex;justify-content:space-between;padding:7px 16px;margin-top:4px;background:#f6fdf7;border-radius:4px">
            <span style="font-size:0.72rem;color:#555">${t('sales.amountPaid') || 'Montant payé'}</span>
            <span style="font-size:0.75rem;font-weight:700;color:#2e7d32">${fCurrency(invoice.amountPaid)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:7px 16px;background:#fff5f5;border-radius:4px;margin-top:2px">
            <span style="font-size:0.72rem;color:#555">${t('sales.amountDue') || 'Montant dû'}</span>
            <span style="font-size:0.75rem;font-weight:700;color:#c62828">${fCurrency(invoice.amountDue)}</span>
          </div>` : `
          <div style="display:flex;justify-content:center;padding:6px;margin-top:4px;background:#f6fdf7;border-radius:4px;border:1px solid #c8e6c9">
            <span style="font-size:0.72rem;font-weight:700;color:#2e7d32;text-transform:uppercase;letter-spacing:1px">✓ ${t('sales.paid')}</span>
          </div>`}
        </div>
      </div>` : `
      <div style="display:flex;justify-content:space-between;margin-top:36px;margin-bottom:24px;gap:24px">
        <div style="flex:1">
          <div style="font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${accent};margin-bottom:8px">Signature Livreur</div>
          <div style="height:64px;border:1.5px dashed #ddd;border-radius:6px;background:#fafafa"></div>
          <div style="font-size:0.68rem;color:#aaa;margin-top:5px;text-align:center">Nom &amp; Signature</div>
        </div>
        <div style="flex:1">
          <div style="font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9e9e9e;margin-bottom:8px">Signature Client</div>
          <div style="height:64px;border:1.5px dashed #ddd;border-radius:6px;background:#fafafa"></div>
          <div style="font-size:0.68rem;color:#aaa;margin-top:5px;text-align:center">Nom &amp; Signature</div>
        </div>
      </div>`;

    const footerHtml = `
      <div style="margin-top:auto;border-top:1px solid #f0f0f0;padding-top:14px;display:flex;flex-direction:${isRtl ? 'row-reverse' : 'row'};justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:${accent}">${t('sales.thankYou') || 'Merci pour votre confiance'}</div>
          <div style="font-size:0.68rem;color:#aaa;margin-top:2px">${t('sales.thankYouSub') || ''}</div>
        </div>
        <div style="font-size:0.62rem;color:#ccc;text-align:${isRtl ? 'left' : 'right'}">
          <div style="font-weight:600;letter-spacing:1px;text-transform:uppercase">${docNumber}</div>
          <div>${fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en')}</div>
        </div>
      </div>`;

    const fullHeaderHtml = `
      <!-- HEADER -->
      <div style="display:flex;flex-direction:${isRtl ? 'row-reverse' : 'row'};justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>${logoHtml}</div>
        <div style="text-align:${isRtl ? 'left' : 'right'}">
          <div style="font-size:1.7rem;font-weight:800;letter-spacing:3px;color:${accent};text-transform:uppercase;line-height:1" class="doc-title">${docTitle}</div>
          <div style="font-size:0.95rem;font-weight:700;margin-top:5px;color:#1a1a1a">${docNumber}</div>
          <div style="font-size:0.72rem;color:#757575;margin-top:3px">${t('common.date') || 'Date'}: <strong>${fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en')}</strong></div>
        </div>
      </div>
      <div style="height:1px;background:${accent}33;margin-top:24px;margin-bottom:35px"></div>
      <!-- FROM / TO -->
      <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:8px">
        <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:14px 16px;border:1px solid #e8e8e8;${isRtl ? 'border-right' : 'border-left'}:3px solid ${accent}">
          <div style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${accent};margin-bottom:8px">${t('sales.from') || 'Émetteur'}</div>
          ${fromLines}
        </div>
        <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:14px 16px;border:1px solid #e8e8e8;${isRtl ? 'border-left' : 'border-left'}:3px solid #ddd">
          <div style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px">${t('sales.billTo') || 'Destinataire'}</div>
          ${toLines}
        </div>
      </div>`;

    const compactHeaderHtml = (pageNum: number) => `
      <div style="display:flex;flex-direction:${isRtl ? 'row-reverse' : 'row'};justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:0.75rem;font-weight:700;color:#1a1a1a">${docNumber}</div>
        <div style="font-size:0.7rem;color:#888">Page ${pageNum} / ${totalPages}</div>
      </div>
      <div style="height:1px;background:${accent}33;margin-bottom:12px"></div>`;

    const pagesHtml = chunks.map((chunk, pageIndex) => {
      const isFirstPage = pageIndex === 0;
      const isLastPage = pageIndex === totalPages - 1;
      const startIndex = pageIndex * PRODUCTS_PER_PAGE;
      const rows = buildRows(chunk, startIndex);
      const header = isFirstPage ? fullHeaderHtml : compactHeaderHtml(pageIndex + 1);
      const amountInWordsHtml = `
        <div style="margin-bottom:16px;padding:10px 14px;background:#f8f9fa;border-radius:4px;border:1px solid #e8e8e8">
          <div style="font-size:0.68rem;color:#888;margin-bottom:3px">${language === 'fr' ? 'Arr\u00eat\u00e9e \u00e0 la somme de:' : language === 'ar' ? '\u0627\u0644\u0645\u0628\u0644\u063a \u0628\u0627\u0644\u062d\u0631\u0648\u0641:' : 'Amount in words:'}</div>
          <div style="font-size:0.82rem;font-weight:600;font-style:italic;color:#1a1a1a">${numberToWords(invoice.total, language)}</div>
        </div>`;
      const bottom = isLastPage ? `${totalsHtml}${amountInWordsHtml}${footerHtml}` : '';
      const pageClass = isLastPage ? 'page' : 'page page-gap';
      return `<div class="${pageClass}">
        ${header}
        ${buildTable(rows)}
        ${bottom}
      </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${language}"><head><meta charset="utf-8"><title>${docNumber}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800${language === 'ar' ? '&family=Cairo:wght@400;600;700;800' : '&family=Playfair+Display:wght@700;800'}&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html { background:#616161; }
  body {
    font-family: ${language === 'ar' ? "'Cairo', Arial, sans-serif" : "'Inter', 'Segoe UI', Arial, sans-serif"};
    color: #1a1a1a;
    background: transparent;
    width: 794px;
    margin: 0 auto;
    direction: ${isRtl ? 'rtl' : 'ltr'};
  }
  .doc-title {
    font-family: ${language === 'ar' ? "'Cairo', Arial, sans-serif" : "'Playfair Display', Georgia, serif"};
  }
  .page {
    background: white;
    padding: 28px 42px 32px;
    min-height: 1122px;
    display: flex;
    flex-direction: column;
  }
  .page-gap { margin-bottom: 32px; }
  th, td { text-align: ${isRtl ? 'right' : 'left'}; }
  th[align="center"], td[align="center"] { text-align: center; }
  th[align="right"], td[align="right"] { text-align: ${isRtl ? 'left' : 'right'}; }
  @media print {
    html { background: white; }
    @page { margin: 0; size: A4; }
    body { width: 100%; }
    .page-gap { page-break-after: always; margin-bottom: 0; }
  }
</style></head>
<body>
${pagesHtml}
</body></html>`;
  }, [invoice, businessInfo, viewMode, accentColor, t, language, dir, getClientByName]);

  const handlePrint = useCallback(() => {
    const html = buildHtml();
    if (html) (window as any).database?.printHtml(html);
  }, [buildHtml]);

  const handleSavePdf = useCallback(() => {
    const html = buildHtml();
    if (!html) return;
    const numeric = invoice!.invoiceNumber.replace(/^[A-Z]+-/, '');
    const prefix = viewMode === 'invoice'
      ? (language === 'fr' ? 'FAC' : language === 'ar' ? 'فاتورة' : 'INV')
      : (language === 'fr' ? 'BL' : language === 'ar' ? 'وصل-تسليم' : 'DN');
    (window as any).database?.savePdf(html, `${prefix}-${numeric}`);
  }, [buildHtml, invoice, viewMode, language]);

  const handleOpenPreview = useCallback(() => {
    const html = buildHtml();
    if (!html) return;
    setPreviewHtml(html);
    setPreviewOpen(true);
  }, [buildHtml]);

  // Auto-print when navigated with ?printMode=
  useEffect(() => {
    if (pendingPrint) {
      setPendingPrint(false);
      const timerId = setTimeout(() => handlePrint(), 300);
      return () => clearTimeout(timerId);
    }
    return undefined;
  }, [pendingPrint, handlePrint]);

  if (!invoice) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('sales.noInvoices')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/sales')}>
            {t('sales.title')}
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  const statusColor = (status: typeof invoice.status) => {
    if (status === 'paid') return 'success';
    if (status === 'partly-paid') return 'warning';
    return 'error';
  };

  const statusLabel = (status: typeof invoice.status) => {
    if (status === 'paid') return t('sales.paid');
    if (status === 'partly-paid') return t('sales.partial');
    return t('sales.unpaid');
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    window.print();
  };

  const handleEdit = (
    data: Omit<Invoice, 'id'>,
    options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery' | 'receipt'; isRetail?: boolean }
  ) => {
    const oldInvoice = invoice;
    const oldAmountPaid = invoice.amountPaid;
    const oldAmountDue = invoice.amountDue;
    const oldTotal = invoice.total;
    const oldItems = options.originalProducts?.map((p) => ({ name: p.name, quantity: p.quantity })) ?? [];
    const newItems = data.products.map((p) => ({ name: p.name, quantity: p.quantity }));

    // Pre-validate stock BEFORE touching anything
    if (options.originalProducts) {
      const { ok, errors } = canDeductAfterRestore(oldItems, newItems);
      if (!ok) {
        showError(errors[0] ?? t('inventory.insufficientStock'));
        return;
      }
    }

    try {
      if (options.originalProducts) {
        restoreStockForInvoice(oldItems);
      }
      const stockResult = deductStockForInvoice(newItems);

      // Stamp buying price snapshot on every updated line item (for accurate profit history)
      const stampedProducts = data.products.map((p) => {
        const fromFifo = stockResult.pricedItems?.find((pi) => pi.name.toLowerCase() === p.name.toLowerCase());
        if (fromFifo) return { ...p, buyingPrice: fromFifo.buyingPrice };
        const fromInventory = inventoryProducts.find((ip) => ip.name.toLowerCase() === p.name.toLowerCase());
        return { ...p, buyingPrice: fromInventory?.buyingPrice ?? 0 };
      });
      data = { ...data, products: stampedProducts };

      updateInvoice(invoice.id, data);
      setInvoice({ ...invoice, ...data });
      // Sync client balance when payment amounts changed
      const paidDelta = Number(data.amountPaid) - Number(oldAmountPaid);
      const dueDelta = Number(data.amountDue) - Number(oldAmountDue);
      const totalDelta = Number(data.total) - Number(oldTotal);
      
      const clientNameChanged = data.client.name !== invoice.client.name;
      if (clientNameChanged) {
        const oldClient = getClientByName(invoice.client.name);
        if (oldClient) {
          const newTotalPurchases = Math.max(0, Number(oldClient.totalPurchases) - Number(invoice.total));
          const newTotalPaid = Math.max(0, Number(oldClient.totalPaid) - Number(invoice.amountPaid));
          const newRemainingBalance = Math.max(0, Number(oldClient.remainingBalance) - Number(invoice.amountDue));
          
          updateClient(oldClient.id, {
            totalPurchases: newTotalPurchases,
            totalPaid: newTotalPaid,
            remainingBalance: newRemainingBalance,
            status: newRemainingBalance <= 0 ? 'paid' : 'unpaid',
          });
        }
      }
      
      const client = getClientByName(data.client.name);
      if (!client) {
        // Unknown client name entered during edit -> create new client
        addClient({
          name: data.client.name,
          phone: data.client.phone || '',
          address: data.client.address || '',
          nif: data.client.nif,
          nis: data.client.nis,
          rc: data.client.rc,
          ai: data.client.ai,
          totalPurchases: Number(data.total),
          totalPaid: Number(data.amountPaid),
          remainingBalance: Number(data.amountDue),
          lastInvoiceDate: new Date().toISOString().split('T')[0],
          status: data.amountDue <= 0 ? 'paid' : data.amountPaid > 0 ? 'partly-paid' : 'unpaid',
        });
      } else if (clientNameChanged) {
        // The new client already exists, and the invoice was moved to them.
        // Add the FULL absolute invoice totals to this existing client.
        const newRemainingBalance = Math.max(0, Number(client.remainingBalance) + Number(data.amountDue));
        const newTotalPurchases = Math.max(0, Number(client.totalPurchases) + Number(data.total));
        updateClient(client.id, {
          totalPaid: Number(client.totalPaid) + Number(data.amountPaid),
          totalPurchases: newTotalPurchases,
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'paid' : 'unpaid',
        });
      } else if (paidDelta !== 0 || dueDelta !== 0 || totalDelta !== 0) {
        // Standard edit: the client name did not change, so just apply the deltas
        const newRemainingBalance = Math.max(0, Number(client.remainingBalance) + dueDelta);
        const newTotalPurchases = Math.max(0, Number(client.totalPurchases) + totalDelta);
        updateClient(client.id, {
          totalPaid: Number(client.totalPaid) + paidDelta,
          totalPurchases: newTotalPurchases,
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'paid' : 'unpaid',
        });
      }
    } catch (err) {
      // Revert local state if any synchronous step throws
      setInvoice(oldInvoice);
      showError(t('sales.failedToUpdate'));
      return;
    }
    setEditDialogOpen(false);
    showSuccess(t('sales.invoiceUpdated'));
  };

  const handleDelete = () => {
    restoreStockForInvoice(invoice.products.map((p) => ({ name: p.name, quantity: p.quantity })));
    
    // Revert client's totalPurchases and balance
    const client = getClientByName(invoice.client.name);
    if (client) {
      const newTotalPurchases = Math.max(0, Number(client.totalPurchases) - Number(invoice.total));
      const newTotalPaid = Math.max(0, Number(client.totalPaid) - Number(invoice.amountPaid));
      const newRemainingBalance = Math.max(0, Number(client.remainingBalance) - Number(invoice.amountDue));
      updateClient(client.id, {
        totalPurchases: newTotalPurchases,
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        status: newRemainingBalance <= 0 ? 'paid' : 'unpaid',
      });
    }

    deleteInvoice(invoice.id);
    showSuccess(`${t('sales.invoiceDeleted')} (${invoice.invoiceNumber})`);
    navigate('/sales');
  };

  const handleRecordPayment = (amount: number) => {
    recordPayment(invoice.id, amount);
    // Sync client balance
    const client = getClientByName(invoice.client.name);
    if (client) recordClientPayment(client.id, amount);
    // Update local state
    const newAmountPaid = Math.min(invoice.amountPaid + amount, invoice.total);
    const newAmountDue = invoice.total - newAmountPaid;
    let newStatus: Invoice['status'] = 'unpaid';
    if (newAmountDue <= 0) newStatus = 'paid';
    else if (newAmountPaid > 0) newStatus = 'partly-paid';
    setInvoice({ ...invoice, amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus });
    showSuccess(`${t('sales.paymentReceived')}: ${amount.toLocaleString()} DA`);
  };

  const handleMarkAsPaid = () => {
    markAsPaid(invoice.id);
    // Sync client balance
    const client = getClientByName(invoice.client.name);
    if (client) recordClientPayment(client.id, invoice.amountDue);
    setInvoice({ ...invoice, amountPaid: invoice.total, amountDue: 0, status: 'paid' });
    showSuccess(`${invoice.invoiceNumber} - ${t('sales.paid')}`);
  };

  return (
    <DashboardContent maxWidth="lg">
      {/* Page header — hidden on print */}
      <Box className="no-print" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
            onClick={() => navigate('/sales')}
          >
            {t('sales.title')}
          </Button>
          <Typography variant="h4">{`${language === 'fr' ? 'FAC' : language === 'ar' ? 'فاتورة' : 'INV'}-${invoice.invoiceNumber.replace(/^[A-Z]+-/, '')}`}</Typography>
          <Label color={statusColor(invoice.status)} sx={{ marginInlineStart: 1 }}>
            {statusLabel(invoice.status)}
          </Label>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {invoice.status !== 'paid' && (
            <>
              <Button
                variant="outlined"
                color="success"
                startIcon={<Iconify icon="solar:wallet-money-bold-duotone" width={20} />}
                onClick={() => setPaymentDialogOpen(true)}
              >
                {t('sales.recordPayment')}
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={20} />}
                onClick={handleMarkAsPaid}
              >
                {t('sales.markAsPaid')}
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold-duotone" width={20} />}
            onClick={() => setEditDialogOpen(true)}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
            onClick={handleOpenPreview}
          >
            {t('common.print')}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:download-bold-duotone" width={20} />}
            onClick={handleSavePdf}
          >
            {t('common.save')} PDF
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={20} />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('common.delete')}
          </Button>
        </Box>
      </Box>

      {/* ─── DOCUMENT TYPE TOGGLE ─── */}
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => { if (val) setViewMode(val as 'invoice' | 'delivery' | 'receipt'); }}
          size="small"
          sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}
        >
          <ToggleButton value="invoice" sx={{ px: 3, fontWeight: 700, textTransform: 'none', gap: 1 }}>
            <Iconify icon="solar:bill-list-bold-duotone" width={18} />
            {t('sales.invoiceNumber').replace('#', '').trim() || 'Invoice'}
          </ToggleButton>
          <ToggleButton value="delivery" sx={{ px: 3, fontWeight: 700, textTransform: 'none', gap: 1 }}>
            <Iconify icon="solar:box-bold-duotone" width={18} />
            {t('sales.bonDeLivraison')}
          </ToggleButton>
          <ToggleButton value="receipt" sx={{ px: 3, fontWeight: 700, textTransform: 'none', gap: 1 }}>
            <Iconify icon="solar:document-text-bold-duotone" width={18} />
            {t('sales.printReceipt')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ─────────────────────────── DOCUMENT CARD ─────────────────────────── */}
      {viewMode === 'receipt' ? (
        <Box className="print-area" sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
          <iframe
            srcDoc={buildReceiptHtml(invoice, businessInfo, language, true, clientTotalDebt)}
            style={{
              width: 320,
              minHeight: 500,
              border: 'none',
              display: 'block',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              borderRadius: '8px',
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
        </Box>
      ) : viewMode === 'delivery' ? (
        /* ── DELIVERY NOTE CARD ── */
        (() => {
          const clientRecord = getClientByName(invoice.client.name);
          const ancienSolde = clientRecord ? Math.max(0, clientRecord.remainingBalance - invoice.amountDue) : 0;
          const nouveauSolde = clientRecord ? clientRecord.remainingBalance : invoice.amountDue;
          const numericPart = invoice.invoiceNumber.replace(/^[A-Z]+-/, '');
          const blPrefix = language === 'fr' ? 'BL' : language === 'ar' ? 'وصل تسليم' : 'DN';
          const blNumber = `${blPrefix}-${numericPart}`;
          const blTitle = language === 'fr' ? 'Bon de livraison' : language === 'ar' ? 'وصل تسليم' : 'Delivery Note';
          const lbl = {
            client:       language === 'fr' ? 'Client'          : language === 'ar' ? 'العميل'           : 'Client',
            date:         language === 'fr' ? 'Date'            : language === 'ar' ? 'التاريخ'          : 'Date',
            code:         language === 'fr' ? 'Code'            : language === 'ar' ? 'الرمز'            : 'Code',
            product:      language === 'fr' ? 'Produit'         : language === 'ar' ? 'المنتج'           : 'Product',
            unitPrice:    language === 'fr' ? 'P.Unite'         : language === 'ar' ? 'سعر الوحدة'       : 'Unit Price',
            qty:          language === 'fr' ? 'QTE'             : language === 'ar' ? 'الكمية'           : 'QTY',
            total:        language === 'fr' ? 'Total'           : language === 'ar' ? 'المجموع'          : 'Total',
            ancienSolde:  language === 'fr' ? 'Ancien Solde'    : language === 'ar' ? 'الرصيد السابق'    : 'Previous Balance',
            payer:        language === 'fr' ? 'Payer'           : language === 'ar' ? 'المدفوع'          : 'Paid',
            nouveauSolde: language === 'fr' ? 'Nouveau Solde'   : language === 'ar' ? 'الرصيد الجديد'    : 'New Balance',
            remise:       language === 'fr' ? 'Remise'          : language === 'ar' ? 'الخصم'            : 'Discount',
            aPayer:       language === 'fr' ? 'A Payer'         : language === 'ar' ? 'المبلغ المستحق'   : 'Amount Due',
            sigLivreur:   language === 'fr' ? 'Signature Livreur' : language === 'ar' ? 'توقيع المسلّم' : 'Delivery Signature',
            sigClient:    language === 'fr' ? 'Signature Client'  : language === 'ar' ? 'توقيع العميل'  : 'Client Signature',
            nomSig:       language === 'fr' ? 'Nom & Signature'   : language === 'ar' ? 'الاسم والتوقيع' : 'Name & Signature',
          };
          return (
            <Card
              data-mui-color-scheme="light"
              ref={printRef}
              className="print-area"
              sx={{ p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: theme.vars.customShadows?.z16 ?? theme.shadows[8], colorScheme: 'light', bgcolor: '#ffffff', color: 'rgba(0,0,0,0.87)', '& .MuiTypography-root': { color: 'inherit' }, '@media print': { boxShadow: 'none', border: 'none' } }}
            >
              <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: 3, md: 3.5 }, pb: { xs: 2, md: 4 } }}>
                {/* top bar: logo + company info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                  <Box>
                    {businessInfo.logo
                      ? <Box component="img" src={businessInfo.logo} alt="logo" sx={{ height: 48, maxWidth: 130, objectFit: 'contain' }} />
                      : <Typography variant="subtitle1" fontWeight={800}>{businessInfo.businessName || ''}</Typography>}
                  </Box>
                  <Box sx={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
                    {businessInfo.businessName && <Typography variant="body2" fontWeight={700}>{businessInfo.businessName}</Typography>}
                    {businessInfo.phone && <Typography variant="caption" display="block" color="text.secondary">{businessInfo.phone}</Typography>}
                    {businessInfo.address && <Typography variant="caption" display="block" color="text.secondary">{businessInfo.address}</Typography>}
                  </Box>
                </Box>
                {/* centered title block */}
                <Box sx={{ textAlign: 'center', borderTop: '2px solid #1a1a1a', borderBottom: '2px solid #1a1a1a', py: 1.25, mb: 2 }}>
                  <Typography variant="h5" fontWeight={800} letterSpacing={2} sx={{ textTransform: 'uppercase', color: '#1a1a1a' }}>
                    {blTitle} N°: {blNumber}
                  </Typography>
                </Box>
                {/* client + date info row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.75, gap: 2, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                  <Box>
                    <Typography variant="body2"><strong>{lbl.client}:</strong> {invoice.client.name}</Typography>
                    {invoice.client.phone && <Typography variant="body2" color="text.secondary">{invoice.client.phone}</Typography>}
                    {invoice.client.address && <Typography variant="body2" color="text.secondary">{invoice.client.address}</Typography>}
                  </Box>
                  <Box sx={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
                    <Typography variant="body2"><strong>{lbl.date}:</strong> {fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en')}</Typography>
                    <Typography variant="body2"><strong>{lbl.code}:</strong> #{numericPart}</Typography>
                  </Box>
                </Box>
                {/* products table */}
                <Box sx={{ overflow: 'hidden', border: '1px solid #e8e8e8', borderRadius: 2, mb: 2.5 }}>
                  <Table size="small" sx={{ '& td, & th': { borderColor: '#f0f0f0' }, '& td': { color: 'rgba(0,0,0,0.87)' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.68rem', width: 32, textAlign: 'center' }}>N</TableCell>
                        <TableCell sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, fontSize: '0.68rem' }}>{lbl.product}</TableCell>
                        <TableCell align="center" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, fontSize: '0.68rem', width: 100 }}>{lbl.unitPrice}</TableCell>
                        <TableCell align="center" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, fontSize: '0.68rem', width: 80 }}>{lbl.qty}</TableCell>
                        <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, fontSize: '0.68rem', width: 110 }}>{lbl.total}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.products.map((p, idx) => {
                        const tvaM = 1 + (invoice.tvaRate || 0) / 100;
                        return (
                          <TableRow key={p.id} sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#f9fafb', '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ textAlign: 'center', color: '#bbb', fontWeight: 700, fontSize: '0.68rem' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                            <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                            <TableCell align="center"><Typography variant="body2">{fCurrency(p.unitPrice * tvaM)}</Typography></TableCell>
                            <TableCell align="center"><Typography variant="body2">{p.quantity}{p.unit && p.unit !== 'pcs' ? ` ${p.unit}` : ''}</Typography></TableCell>
                            <TableCell align="right"><Typography variant="body2" fontWeight={700}>{fCurrency(p.total * tvaM)}</Typography></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
                {/* bottom: totals */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                  <Box sx={{ minWidth: 220 }}>
                    <Box sx={{ bgcolor: '#1a1a2e', color: 'white', px: 2, py: 1.25, borderRadius: '6px 6px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'white !important', textTransform: 'uppercase' }}>{lbl.total}</Typography>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white !important' }}>{fCurrency(invoice.total)}</Typography>
                    </Box>
                    <Box sx={{ border: '1px solid #e0e0e0', borderTop: 'none', px: 2, py: 0.875, display: 'flex', justifyContent: 'space-between', bgcolor: '#f8f9fa', borderRadius: '0 0 6px 6px' }}>
                      <Typography variant="body2" fontWeight={700}>{lbl.aPayer}:</Typography>
                      <Typography variant="body2" fontWeight={800}>{fCurrency(invoice.amountDue)}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* ── DELIVERY SIGNATURES ── */}
                <Box sx={{ display: 'flex', gap: 3, mt: 4.5, mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: '#1a1a1a', fontWeight: 700, letterSpacing: 1.5, fontSize: '0.62rem', display: 'block', mb: 1 }}>{lbl.sigLivreur}</Typography>
                    <Box sx={{ height: 64, border: '1.5px dashed #ddd', borderRadius: 1.5, bgcolor: '#fafafa' }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>{lbl.nomSig}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" sx={{ color: '#9e9e9e', fontWeight: 700, letterSpacing: 1.5, fontSize: '0.62rem', display: 'block', mb: 1 }}>{lbl.sigClient}</Typography>
                    <Box sx={{ height: 64, border: '1.5px dashed #ddd', borderRadius: 1.5, bgcolor: '#fafafa' }} />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>{lbl.nomSig}</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          );
        })()
      ) : (
      /* ── INVOICE CARD ── */
      <Card
        data-mui-color-scheme="light"
        ref={printRef}
        className="print-area"
        sx={{
          p: 0,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.vars.customShadows?.z16 ?? theme.shadows[8],
          colorScheme: 'light',
          bgcolor: '#ffffff',
          color: 'rgba(0,0,0,0.87)',
          '& .MuiTypography-root': { color: 'inherit' },
          '@media print': { boxShadow: 'none', border: 'none' },
        }}
      >
        <Box sx={{ px: { xs: 3, md: 5.25 }, pt: { xs: 3, md: 3.5 }, pb: { xs: 2, md: 4 } }}>

          {/* ── HEADER ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            <Box>
              {businessInfo.logo ? (
                <Box component="img" src={businessInfo.logo} alt="logo" sx={{ height: 60, maxWidth: 160, objectFit: 'contain' }} />
              ) : (
                <Typography variant="h6" fontWeight={800} letterSpacing={-0.5}>{businessInfo.businessName || 'Your Company'}</Typography>
              )}
            </Box>
            <Box sx={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
              <Typography variant="h4" fontWeight={800} letterSpacing={3} sx={{ color: '#1a1a1a', textTransform: 'uppercase', lineHeight: 1, fontFamily: 'Playfair Display, Georgia, serif' }}>
                {viewMode === 'invoice' ? (t('sales.invoiceNumber').replace('#', '').trim() || 'INVOICE') : (t('sales.bonDeLivraison') || 'BON DE LIVRAISON')}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5, color: '#1a1a1a' }}>
                {(() => {
                  const numeric = invoice.invoiceNumber.replace(/^[A-Z]+-/, '');
                  const invPrefix = language === 'fr' ? 'FAC' : language === 'ar' ? 'فاتورة' : 'INV';
                  const delPrefix = language === 'fr' ? 'BL' : language === 'ar' ? 'وصل تسليم' : 'DN';
                  return viewMode === 'invoice' ? `${invPrefix}-${numeric}` : `${delPrefix}-${numeric}`;
                })()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: dir === 'rtl' ? 'flex-start' : 'flex-end', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#757575' }}>
                  {t('common.date')}: <strong>{fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en')}</strong>
                </Typography>
                {viewMode === 'invoice' && (
                  <Chip size="small" label={statusLabel(invoice.status)} color={statusColor(invoice.status)} sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* ── DIVIDER ── */}
          <Box sx={{ height: '1px', bgcolor: 'rgba(26,26,26,0.15)', mt: 3, mb: '35px' }} />

          {/* ── FROM / TO ── */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3.25, flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            <Box sx={{ flex: 1, bgcolor: '#f8f9fa', borderRadius: 2, p: '14px 16px', border: '1px solid #e8e8e8', borderLeft: dir === 'rtl' ? '1px solid #e8e8e8' : '3px solid #1a1a1a', borderRight: dir === 'rtl' ? '3px solid #1a1a1a' : '1px solid #e8e8e8' }}>
              <Typography variant="overline" sx={{ color: '#1a1a1a', fontWeight: 700, letterSpacing: 2, fontSize: '0.6rem', mb: 1, display: 'block' }}>{t('sales.from')}</Typography>
              <Typography variant="subtitle2" fontWeight={700}>{businessInfo.businessName || 'Your Business'}</Typography>
              {businessInfo.address && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.address}</Typography>}
              {businessInfo.phone && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.phone}</Typography>}
              {businessInfo.email && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.email}</Typography>}
              {(businessInfo.nif || businessInfo.nis || businessInfo.rc || businessInfo.ai) && (
                <Box sx={{ mt: 0.75 }}>
                  {businessInfo.nif && <Typography variant="caption" color="text.secondary" display="block"><strong>NIF:</strong> {businessInfo.nif}</Typography>}
                  {businessInfo.nis && <Typography variant="caption" color="text.secondary" display="block"><strong>NIS:</strong> {businessInfo.nis}</Typography>}
                  {businessInfo.rc && <Typography variant="caption" color="text.secondary" display="block"><strong>RC:</strong> {businessInfo.rc}</Typography>}
                  {businessInfo.ai && <Typography variant="caption" color="text.secondary" display="block"><strong>AI:</strong> {businessInfo.ai}</Typography>}
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1, bgcolor: '#f8f9fa', borderRadius: 2, p: '14px 16px', border: '1px solid #e8e8e8', borderLeft: '3px solid #ddd' }}>
              <Typography variant="overline" sx={{ color: '#999', fontWeight: 700, letterSpacing: 2, fontSize: '0.6rem', mb: 1, display: 'block' }}>{t('sales.billTo')}</Typography>
              <Typography variant="subtitle2" fontWeight={700}>{invoice.client.name}</Typography>
              {invoice.client.phone && <Typography variant="caption" color="text.secondary" display="block">{invoice.client.phone}</Typography>}
              {invoice.client.address && <Typography variant="caption" color="text.secondary" display="block">{invoice.client.address}</Typography>}
              {(invoice.client.nif || invoice.client.nis || invoice.client.rc || invoice.client.ai) && (
                <Box sx={{ mt: 0.75 }}>
                  {invoice.client.nif && <Typography variant="caption" color="text.secondary" display="block"><strong>NIF:</strong> {invoice.client.nif}</Typography>}
                  {invoice.client.nis && <Typography variant="caption" color="text.secondary" display="block"><strong>NIS:</strong> {invoice.client.nis}</Typography>}
                  {invoice.client.rc && <Typography variant="caption" color="text.secondary" display="block"><strong>RC:</strong> {invoice.client.rc}</Typography>}
                  {invoice.client.ai && <Typography variant="caption" color="text.secondary" display="block"><strong>AI:</strong> {invoice.client.ai}</Typography>}
                </Box>
              )}
            </Box>
          </Box>

          {/* ── PRODUCTS TABLE ── */}
          <Box sx={{ overflow: 'hidden', border: '1px solid #e8e8e8', borderRadius: 2, mb: 2.5, mt: 2 }}>
            <Table size="small" sx={{ '& td, & th': { borderColor: '#f0f0f0' }, '& td': { color: 'rgba(0,0,0,0.87)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, width: 36, fontSize: '0.65rem', letterSpacing: 1 }}>#</TableCell>
                  <TableCell sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('common.product')}</TableCell>
                  <TableCell align="center" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, width: 80, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('common.quantity')}</TableCell>
                  {viewMode === 'invoice' && (
                    <>
                      <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, width: 115, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('common.price')}</TableCell>
                      <TableCell align="right" sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', fontWeight: 600, width: 115, fontSize: '0.7rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('common.total')}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.products.map((product, idx) => (
                  <TableRow key={product.id} sx={{ bgcolor: idx % 2 === 0 ? '#ffffff' : '#f9fafb', '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ color: '#bbb', fontWeight: 700, fontSize: '0.68rem' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{product.name}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{product.quantity}{product.unit && product.unit !== 'pcs' ? ` ${product.unit}` : ''}</Typography></TableCell>
                    {viewMode === 'invoice' && (
                      <>
                        <TableCell align="right"><Typography variant="body2" sx={{ color: '#555' }}>{fCurrency(product.unitPrice)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={700}>{fCurrency(product.total)}</Typography></TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>



          {/* ── TOTALS (invoice only) ── */}
          {viewMode === 'invoice' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Box sx={{ width: 300 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="caption" color="text.secondary">{t('common.subtotal')} HT</Typography>
                  <Typography variant="caption" fontWeight={600}>{fCurrency(invoice.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="caption" color="text.secondary">TVA ({invoice.tvaRate}%)</Typography>
                  <Typography variant="caption" fontWeight={600}>{fCurrency(invoice.tvaAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, bgcolor: '#1a1a1a', borderRadius: 1.5, mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white !important', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('common.total')} TTC</Typography>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white !important' }}>{fCurrency(invoice.total)}</Typography>
                </Box>
                {invoice.status !== 'paid' ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.875, mt: 0.5, bgcolor: '#f6fdf7', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('sales.amountPaid')}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#2e7d32' }}>{fCurrency(invoice.amountPaid)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.875, bgcolor: '#fff5f5', borderRadius: 1, mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary">{t('sales.amountDue')}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#c62828' }}>{fCurrency(invoice.amountDue)}</Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.75, mt: 0.5, bgcolor: '#f6fdf7', borderRadius: 1, border: '1px solid #c8e6c9' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#2e7d32', textTransform: 'uppercase', letterSpacing: 1 }}>✓ {t('sales.paid')}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ── AMOUNT IN WORDS ── */}
          {viewMode === 'invoice' && (
            <Box sx={{ mb: 2.5, px: 1.5, py: 1.25, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e8e8e8' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                {language === 'fr' ? 'Arrêtée à la somme de:' : language === 'ar' ? 'المبلغ بالحروف:' : 'Amount in words:'}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontStyle: 'italic' }}>
                {numberToWords(invoice.total, language)}
              </Typography>
            </Box>
          )}

          {/* ── FOOTER ── */}
          <Box sx={{ borderTop: '1px solid #f0f0f0', pt: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a1a' }}>{t('sales.thankYou')}</Typography>
              <Typography variant="caption" color="text.secondary">{t('sales.thankYouSub')}</Typography>
            </Box>
            <Box sx={{ textAlign: dir === 'rtl' ? 'left' : 'right' }}>
              <Typography variant="caption" sx={{ color: '#ccc', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', display: 'block' }}>{`${language === 'fr' ? 'FAC' : language === 'ar' ? 'فاتورة' : 'INV'}-${invoice.invoiceNumber.replace(/^[A-Z]+-/, '')}`}</Typography>
              <Typography variant="caption" sx={{ color: '#ccc' }}>{fDateLocale(invoice.createdAt, language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en')}</Typography>
            </Box>
          </Box>

        </Box>
      </Card>
      )}
      {/* Edit Dialog */}
      <SalesNewInvoiceDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEdit}
        editInvoice={invoice}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('sales.deleteInvoice')}
        content={`${t('common.confirm')} ${t('common.delete').toLowerCase()} ${invoice.invoiceNumber}?`}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Record Payment Dialog */}
      <SalesRecordPaymentDialog
        open={paymentDialogOpen}
        invoice={invoice}
        onClose={() => setPaymentDialogOpen(false)}
        onSave={handleRecordPayment}
      />

      {/* Print Preview Dialog */}
      <SalesPrintPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        htmlContent={previewHtml}
      />
    </DashboardContent>
  );
}
