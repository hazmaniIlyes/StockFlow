import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { ConfirmDialog } from 'src/components/confirm-dialog';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';

import { useBusiness, useTranslation, useInventory } from 'src/contexts';

import { DashboardContent } from 'src/layouts/dashboard';

import { useInvoices } from '../context';
import { SalesNewInvoiceDialog } from '../sales-new-invoice-dialog';
import { SalesRecordPaymentDialog } from '../sales-record-payment-dialog';

import type { Invoice, InvoiceProduct } from 'src/_mock/_data';

// ======================================================================

export function SalesDetailView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { showSuccess } = useSnackbar();
  const { businessInfo } = useBusiness();
  const { t } = useTranslation();
  const { getInvoice, updateInvoice, deleteInvoice, recordPayment, markAsPaid } = useInvoices();
  const { restoreStockForInvoice, deductStockForInvoice } = useInventory();

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'invoice' | 'delivery'>('invoice');

  // Fetch invoice from context whenever id changes
  useEffect(() => {
    if (id) {
      setInvoice(getInvoice(id));
    }
  }, [id, getInvoice]);

  const shouldPrint = searchParams.get('print') === 'true';
  const printMode = searchParams.get('printMode') as 'invoice' | 'delivery' | null;
  const [pendingPrint, setPendingPrint] = useState(false);

  // Handle legacy ?print=true
  useEffect(() => {
    if (shouldPrint && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [shouldPrint, invoice]);

  // Handle ?printMode=invoice|delivery — set view mode then trigger popup print
  useEffect(() => {
    if (printMode && invoice) {
      setViewMode(printMode);
      setPendingPrint(true);
    }
  }, [printMode, invoice]);

  const handlePrint = useCallback(() => {
    const printArea = printRef.current;
    if (!printArea) return;

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
        } catch {
          return sheet.href ? `@import url('${sheet.href}');` : '';
        }
      })
      .join('\n');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><title></title>
<style>${styles}</style>
<style>
  @page { margin: 0; }
  body { margin: 0; padding: 12mm 14mm; background: white; }
</style>
</head><body>${printArea.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }, []);

  // Auto-print when navigated with ?printMode=
  useEffect(() => {
    if (pendingPrint) {
      setPendingPrint(false);
      setTimeout(() => handlePrint(), 300);
    }
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
    options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery' }
  ) => {
    if (options.originalProducts) {
      restoreStockForInvoice(options.originalProducts.map((p) => ({ name: p.name, quantity: p.quantity })));
    }
    deductStockForInvoice(data.products.map((p) => ({ name: p.name, quantity: p.quantity })));
    updateInvoice(invoice.id, data);
    setInvoice({ ...invoice, ...data });
    setEditDialogOpen(false);
    showSuccess(t('sales.invoiceUpdated'));
  };

  const handleDelete = () => {
    restoreStockForInvoice(invoice.products.map((p) => ({ name: p.name, quantity: p.quantity })));
    deleteInvoice(invoice.id);
    showSuccess(`${t('sales.invoiceDeleted')} (${invoice.invoiceNumber})`);
    navigate('/sales');
  };

  const handleRecordPayment = (amount: number) => {
    recordPayment(invoice.id, amount);
    // Update local state to reflect changes
    const newAmountPaid = Math.min(invoice.amountPaid + amount, invoice.total);
    const newAmountDue = invoice.total - newAmountPaid;
    let newStatus: Invoice['status'] = 'unpaid';
    if (newAmountDue <= 0) newStatus = 'paid';
    else if (newAmountPaid > 0) newStatus = 'partly-paid';

    setInvoice({
      ...invoice,
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: newStatus,
    });
    showSuccess(`${t('sales.paymentReceived')}: ${amount.toLocaleString()} DA`);
  };

  const handleMarkAsPaid = () => {
    markAsPaid(invoice.id);
    setInvoice({
      ...invoice,
      amountPaid: invoice.total,
      amountDue: 0,
      status: 'paid',
    });
    showSuccess(`${invoice.invoiceNumber} - ${t('sales.paid')}`);
  };

  const theme = useTheme();
  const accentColor = theme.palette.primary.main;

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
          <Typography variant="h4">{invoice.invoiceNumber}</Typography>
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
            onClick={handlePrint}
          >
            {t('common.print')}
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
          onChange={(_, val) => { if (val) setViewMode(val); }}
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
        </ToggleButtonGroup>
      </Box>

      {/* ─────────────────────────── INVOICE DOCUMENT ─────────────────────────── */}
      <Card
        data-mui-color-scheme="light"
        ref={printRef}
        className="print-area"
        sx={{
          p: 0,
          borderRadius: 0,
          overflow: 'hidden',
          boxShadow: theme.vars.customShadows?.z16 ?? theme.shadows[8],
          colorScheme: 'light',
          bgcolor: '#ffffff',
          color: 'rgba(0,0,0,0.87)',
          '& .MuiTypography-root': { color: 'inherit' },
          '@media print': { boxShadow: 'none', border: 'none' },
        }}
      >
        {/* TOP ACCENT BAR */}
        <Box sx={{ height: 4, bgcolor: accentColor }} />

        <Box sx={{ px: { xs: 3, md: 4.5 }, pt: { xs: 2.5, md: 3 }, pb: { xs: 2, md: 2.5 } }}>

          {/* ── HEADER ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            {/* Left: logo / company name */}
            <Box>
              {businessInfo.logo ? (
                <Box
                  component="img"
                  src={businessInfo.logo}
                  alt="logo"
                  sx={{ height: 64, maxWidth: 160, objectFit: 'contain' }}
                />
              ) : (
                <Typography variant="h6" fontWeight={700}>
                  {businessInfo.businessName || 'Your Company'}
                </Typography>
              )}
            </Box>

            {/* Right: document label + number + date */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h4"
                fontWeight={800}
                letterSpacing={3}
                sx={{ color: accentColor, textTransform: 'uppercase', lineHeight: 1 }}
              >
                {viewMode === 'invoice' ? (t('sales.invoiceNumber').replace('#', '').trim() || 'INVOICE') : t('sales.bonDeLivraison').toUpperCase()}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
                {viewMode === 'invoice' ? invoice.invoiceNumber : `BL-${invoice.invoiceNumber.replace(/^INV-/, '')}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('common.date')}: <strong>{fDate(invoice.createdAt)}</strong>
                </Typography>
                {viewMode === 'invoice' && (
                  <Chip
                    size="small"
                    label={statusLabel(invoice.status)}
                    color={statusColor(invoice.status)}
                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* ── THIN DIVIDER ── */}
          <Box sx={{ height: 1, bgcolor: alpha(accentColor, 0.2), mb: 2.5 }} />

          {/* ── FROM / BILL TO ── */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                variant="overline"
                sx={{ color: accentColor, fontWeight: 700, letterSpacing: 1.5, mb: 0.75, display: 'block', fontSize: '0.65rem' }}
              >
                {t('sales.from')}
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>{businessInfo.businessName || 'Your Business'}</Typography>
              {businessInfo.address && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.address}</Typography>}
              {businessInfo.phone && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.phone}</Typography>}
              {businessInfo.email && <Typography variant="caption" color="text.secondary" display="block">{businessInfo.email}</Typography>}
              {(businessInfo.nif || businessInfo.nis || businessInfo.rc || businessInfo.ai) && (
                <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {businessInfo.nif && <Typography variant="caption" color="text.secondary"><strong>NIF:</strong> {businessInfo.nif}</Typography>}
                  {businessInfo.nis && <Typography variant="caption" color="text.secondary"><strong>NIS:</strong> {businessInfo.nis}</Typography>}
                  {businessInfo.rc && <Typography variant="caption" color="text.secondary"><strong>RC:</strong> {businessInfo.rc}</Typography>}
                  {businessInfo.ai && <Typography variant="caption" color="text.secondary"><strong>AI:</strong> {businessInfo.ai}</Typography>}
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }} offset={{ sm: 'auto' }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: 1.5, mb: 0.75, display: 'block', fontSize: '0.65rem' }}
              >
                {t('sales.billTo')}
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>{invoice.client.name}</Typography>
              {invoice.client.phone && <Typography variant="caption" color="text.secondary" display="block">{invoice.client.phone}</Typography>}
              {invoice.client.address && <Typography variant="caption" color="text.secondary" display="block">{invoice.client.address}</Typography>}
              {(invoice.client.nif || invoice.client.nis || invoice.client.rc || invoice.client.ai) && (
                <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {invoice.client.nif && <Typography variant="caption" color="text.secondary"><strong>NIF:</strong> {invoice.client.nif}</Typography>}
                  {invoice.client.nis && <Typography variant="caption" color="text.secondary"><strong>NIS:</strong> {invoice.client.nis}</Typography>}
                  {invoice.client.rc && <Typography variant="caption" color="text.secondary"><strong>RC:</strong> {invoice.client.rc}</Typography>}
                  {invoice.client.ai && <Typography variant="caption" color="text.secondary"><strong>AI:</strong> {invoice.client.ai}</Typography>}
                </Box>
              )}
            </Grid>
          </Grid>

          {/* ── PRODUCTS TABLE ── */}
          <Box sx={{ overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', mb: 2, mt: 9 }}>
            <Table size="small" sx={{ '& td, & th': { borderColor: 'rgba(0,0,0,0.12)' }, '& td': { color: 'rgba(0,0,0,0.87)' } }}>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#1565C0', py: 1 } }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, width: 36 }}>#</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>{t('common.product')}</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 700, width: 80 }}>{t('common.quantity')}</TableCell>
                  {viewMode === 'invoice' && (
                    <>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 700, width: 110 }}>{t('common.price')} (DA)</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 700, width: 110 }}>{t('common.total')} (DA)</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.products.map((product, idx) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? '#ffffff' : alpha(accentColor, 0.05),
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell sx={{ color: 'rgba(0,0,0,0.38)', fontWeight: 600, fontSize: '0.75rem' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {product.quantity}{product.unit && product.unit !== 'pcs' ? ` ${product.unit}` : ''}
                      </Typography>
                    </TableCell>
                    {viewMode === 'invoice' && (
                      <>
                        <TableCell align="right">
                          <Typography variant="body2">{fCurrency(product.unitPrice)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>{fCurrency(product.total)}</Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* ── TOTALS (invoice only) ── */}
          {viewMode === 'delivery' && (
            <Grid container spacing={4} sx={{ mt: 6, mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="overline" sx={{ color: accentColor, fontWeight: 700, letterSpacing: 1.5, fontSize: '0.65rem', display: 'block', mb: 1 }}>
                  Signature Livreur
                </Typography>
                <Box sx={{ height: 60, border: '1px dashed rgba(0,0,0,0.2)', borderRadius: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Nom &amp; Signature
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} offset={{ sm: 'auto' }}>
                <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: 1.5, fontSize: '0.65rem', display: 'block', mb: 1 }}>
                  Signature Client
                </Typography>
                <Box sx={{ height: 60, border: '1px dashed rgba(0,0,0,0.2)', borderRadius: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Nom &amp; Signature
                </Typography>
              </Grid>
            </Grid>
          )}
          {viewMode === 'invoice' && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
            <Box sx={{ width: { xs: '100%', sm: 280 }, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.85 }}>
                <Typography variant="caption" color="text.secondary">{t('common.subtotal')} HT</Typography>
                <Typography variant="caption" fontWeight={600}>{fCurrency(invoice.subtotal)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.85 }}>
                <Typography variant="caption" color="text.secondary">TVA ({invoice.tvaRate}%)</Typography>
                <Typography variant="caption" fontWeight={600}>{fCurrency(invoice.tvaAmount)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1, bgcolor: accentColor }}>
                <Typography variant="subtitle2" fontWeight={700} color="white">{t('common.total')} TTC</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="white">{fCurrency(invoice.total)}</Typography>
              </Box>
              {invoice.status !== 'paid' && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.85 }}>
                    <Typography variant="caption" color="text.secondary">{t('sales.amountPaid')}</Typography>
                    <Typography variant="caption" color="success.main" fontWeight={600}>{fCurrency(invoice.amountPaid)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.85, bgcolor: alpha(theme.palette.error.main, 0.06) }}>
                    <Typography variant="caption" color="error.main" fontWeight={700}>{t('sales.amountDue')}</Typography>
                    <Typography variant="caption" color="error.main" fontWeight={700}>{fCurrency(invoice.amountDue)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>}

          {/* ── FOOTER ── */}
          <Box sx={{ height: 1, bgcolor: alpha(accentColor, 0.15), mb: 1.5, '@media print': { display: 'none' } }} />
          <Box sx={{ textAlign: 'center', '@media print': { display: 'none' } }}>
            <Typography variant="subtitle2" fontWeight={700} color={accentColor}>
              {t('sales.thankYou')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('sales.thankYouSub')}
            </Typography>
          </Box>
        </Box>

        {/* BOTTOM ACCENT BAR */}
        <Box sx={{
          height: 4,
          bgcolor: accentColor,
          '@media print': { position: 'fixed', bottom: '12mm', left: '14mm', right: '14mm' },
        }} />

        {/* FOOTER TEXT — fixed just above the bottom bar on print */}
        <Box sx={{
          display: 'none',
          '@media print': {
            display: 'block',
            position: 'fixed',
            bottom: 'calc(12mm + 10px)',
            left: '14mm',
            right: '14mm',
            textAlign: 'center',
            pb: 1,
          },
        }}>
          <Typography variant="subtitle2" fontWeight={700} color={accentColor}>
            {t('sales.thankYou')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('sales.thankYouSub')}
          </Typography>
        </Box>
      </Card>

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
    </DashboardContent>
  );
}
