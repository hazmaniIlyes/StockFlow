import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { useClients, useInventory, useTranslation } from 'src/contexts';

import { ConfirmDialog } from 'src/components/confirm-dialog';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { DashboardContent } from 'src/layouts/dashboard';

import { useInvoices } from '../context';
import { SalesInvoiceList } from '../sales-invoice-list';
import { SalesNewInvoiceDialog } from '../sales-new-invoice-dialog';
import { SalesRecordPaymentDialog } from '../sales-record-payment-dialog';
import { SalesSummaryCard } from '../sales-summary-card';

import type { Invoice, InvoiceProduct } from 'src/_mock/_data';

// ======================================================================

export function SalesView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError, showWarning } = useSnackbar();
  const {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordPayment,
    markAsPaid,
    getSummary,
  } = useInvoices();
  const { updateClientFromInvoice, recordPayment: recordClientPayment, getClientByName } = useClients();
  const { deductStockForInvoice, restoreStockForInvoice } = useInventory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Record payment
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);

  // Dynamic summary
  const summary = useMemo(() => getSummary(), [getSummary]);

  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setDialogOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDialogOpen(true);
  };

  const handleSave = useCallback(
    (
      data: Omit<Invoice, 'id'>,
      options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery' }
    ) => {
      try {
        const productItems = data.products.map((p) => ({ name: p.name, quantity: p.quantity }));
        let savedInvoiceId: string | undefined;

        if (options.isEdit && editingInvoice) {
          // Restore stock from original products first
          if (options.originalProducts) {
            const originalItems = options.originalProducts.map((p) => ({
              name: p.name,
              quantity: p.quantity,
            }));
            restoreStockForInvoice(originalItems);
          }

          // Deduct stock for new products
          const stockResult = deductStockForInvoice(productItems);
          if (!stockResult.success) {
            // Re-deduct original if validation failed
            if (options.originalProducts) {
              const originalItems = options.originalProducts.map((p) => ({
                name: p.name,
                quantity: p.quantity,
              }));
              deductStockForInvoice(originalItems);
            }
            showError(`Stock error: ${stockResult.errors.join(', ')}`);
            return;
          }

          // added: apply FIFO-weighted prices to the invoice before updating it
          if (stockResult.pricedItems && stockResult.pricedItems.length > 0) { // added: only patch when batch pricing data was returned
            const patchedProducts = data.products.map((p) => { // added: rebuild the invoice product list with corrected prices
              const fi = stockResult.pricedItems!.find((pi) => pi.name.toLowerCase() === p.name.toLowerCase()); // added: look up FIFO result for this line item
              return fi ? { ...p, unitPrice: fi.unitPrice, total: fi.total } : p; // added: override price and total if FIFO data exists; otherwise leave unchanged
            });
            const newTotal = patchedProducts.reduce((sum, p) => sum + p.total, 0); // added: recompute invoice grand total from corrected line items
            const newTvaAmount = newTotal * (data.tvaRate / 100); // added: recompute TVA proportionally
            const newSubtotal = newTotal - newTvaAmount; // added: recompute HT subtotal
            const newAmountPaid = data.status === 'paid' ? newTotal : Math.min(data.amountPaid, newTotal); // added: if fully paid keep amountPaid = new total; else cap at new total
            data = { ...data, products: patchedProducts, total: newTotal, tvaAmount: newTvaAmount, subtotal: newSubtotal, amountPaid: newAmountPaid, amountDue: newTotal - newAmountPaid }; // added: replace data with fully patched invoice before saving
          }

          updateInvoice(editingInvoice.id, data);
          savedInvoiceId = editingInvoice.id;
          showSuccess(t('sales.invoiceUpdated'));
        } else {
          // New invoice - deduct stock
          const stockResult = deductStockForInvoice(productItems);
          if (!stockResult.success) {
            showError(`Stock error: ${stockResult.errors.join(', ')}`);
            return;
          }

          // added: apply FIFO-weighted prices to the invoice before persisting it
          if (stockResult.pricedItems && stockResult.pricedItems.length > 0) { // added: only patch when batch pricing data was returned
            const patchedProducts = data.products.map((p) => { // added: rebuild the invoice product list with corrected prices
              const fi = stockResult.pricedItems!.find((pi) => pi.name.toLowerCase() === p.name.toLowerCase()); // added: look up FIFO result for this line item
              return fi ? { ...p, unitPrice: fi.unitPrice, total: fi.total } : p; // added: override price and total if FIFO data exists; otherwise leave unchanged
            });
            const newTotal = patchedProducts.reduce((sum, p) => sum + p.total, 0); // added: recompute invoice grand total from corrected line items
            const newTvaAmount = newTotal * (data.tvaRate / 100); // added: recompute TVA proportionally
            const newSubtotal = newTotal - newTvaAmount; // added: recompute HT subtotal
            const newAmountPaid = data.status === 'paid' ? newTotal : Math.min(data.amountPaid, newTotal); // added: if fully paid keep amountPaid = new total; else cap at new total
            data = { ...data, products: patchedProducts, total: newTotal, tvaAmount: newTvaAmount, subtotal: newSubtotal, amountPaid: newAmountPaid, amountDue: newTotal - newAmountPaid }; // added: replace data with fully patched invoice before calling addInvoice
          }

          const newInvoice = addInvoice(data);
          savedInvoiceId = newInvoice.id;

          // Update client record
          updateClientFromInvoice(
            data.client.name,
            data.client.phone,
            data.client.address,
            data.total,
            data.amountPaid,
            { nif: data.client.nif, nis: data.client.nis, rc: data.client.rc, ai: data.client.ai }
          );

          showSuccess(t('sales.invoiceCreated'), !options.printMode && savedInvoiceId ? {
            label: t('common.view'),
            onClick: () => navigate(`/sales/${savedInvoiceId}`),
          } : undefined);
        }

        setDialogOpen(false);
        setEditingInvoice(null);

        // Navigate to print if requested
        if (options.printMode && savedInvoiceId) {
          navigate(`/sales/${savedInvoiceId}?printMode=${options.printMode}`);
        }
      } catch (e) {
        showError(t('common.error'));
      }
    },
    [
      editingInvoice,
      addInvoice,
      updateInvoice,
      updateClientFromInvoice,
      deductStockForInvoice,
      restoreStockForInvoice,
      showSuccess,
      showError,
      navigate,
    ]
  );

  const handleDeleteRequest = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setInvoiceToDelete(invoice);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (invoiceToDelete) {
      // Restore stock when deleting invoice
      const productItems = invoiceToDelete.products.map((p) => ({
        name: p.name,
        quantity: p.quantity,
      }));
      restoreStockForInvoice(productItems);

      deleteInvoice(invoiceToDelete.id);
      showSuccess(`${t('sales.invoiceDeleted')} (${invoiceToDelete.invoiceNumber})`);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleRecordPaymentRequest = (invoice: Invoice) => {
    setInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = (amount: number) => {
    if (invoiceForPayment) {
      recordPayment(invoiceForPayment.id, amount);
      const client = getClientByName(invoiceForPayment.client.name);
      if (client) recordClientPayment(client.id, amount);
      showSuccess(`${t('sales.paymentReceived')}: ${amount.toLocaleString()} DA`);
    }
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    const client = getClientByName(invoice.client.name);
    if (client) recordClientPayment(client.id, invoice.amountDue);
    markAsPaid(invoice.id);
    showSuccess(`${invoice.invoiceNumber} - ${t('sales.paid')}`);
  };

  const handleRowClick = (invoice: Invoice) => {
    navigate(`/sales/${invoice.id}`);
  };

  const handlePrint = (invoice: Invoice) => {
    navigate(`/sales/${invoice.id}?print=true`);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 3, md: 5 },
        }}
      >
        <Typography variant="h4">{t('sales.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleNewInvoice}
        >
          {t('sales.newInvoice')}
        </Button>
      </Box>

      {/* Summary Cards - Now Dynamic */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesSummaryCard
            title={t('dashboard.todaySales')}
            total={summary.today.totalSales}
            profit={summary.today.profit}
            count={summary.today.count}
            icon="solar:dollar-minimalistic-bold-duotone"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesSummaryCard
            title={t('dashboard.pendingPayments')}
            total={summary.pending.totalAmount}
            count={summary.pending.count}
            icon="solar:clock-circle-bold-duotone"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesSummaryCard
            title={t('dashboard.thisMonth')}
            total={summary.thisMonth.totalSales}
            profit={summary.thisMonth.profit}
            count={summary.thisMonth.count}
            icon="solar:graph-up-bold-duotone"
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesSummaryCard
            title={t('sales.overdue')}
            total={summary.overdue.totalAmount}
            count={summary.overdue.count}
            icon="solar:danger-triangle-bold-duotone"
            color="error"
          />
        </Grid>
      </Grid>

      {/* Invoice List */}
      <SalesInvoiceList
        invoices={invoices}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onPrint={handlePrint}
        onRecordPayment={handleRecordPaymentRequest}
        onMarkAsPaid={handleMarkAsPaid}
      />

      {/* New/Edit Invoice Dialog */}
      <SalesNewInvoiceDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSave}
        editInvoice={editingInvoice}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('sales.deleteInvoice')}
        content={`${t('common.confirm')} ${t('common.delete').toLowerCase()} ${invoiceToDelete?.invoiceNumber}?`}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setInvoiceToDelete(null);
        }}
      />

      {/* Record Payment Dialog */}
      <SalesRecordPaymentDialog
        open={paymentDialogOpen}
        invoice={invoiceForPayment}
        onClose={() => {
          setPaymentDialogOpen(false);
          setInvoiceForPayment(null);
        }}
        onSave={handleRecordPayment}
      />
    </DashboardContent>
  );
}
