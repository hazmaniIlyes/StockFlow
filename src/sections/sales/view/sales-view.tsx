import type { Invoice, InvoiceProduct } from 'src/_mock/_data';

import { useNavigate } from 'react-router-dom';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { settingsDB } from 'src/services/db';
import { DashboardContent } from 'src/layouts/dashboard';
import { useClients, useInventory, useSettings, useTranslation, useBusiness } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/confirm-dialog';
import { PrinterPickerDialog } from 'src/components/printer-picker-dialog';

import { useInvoices } from '../context';
import { SalesInvoiceList } from '../sales-invoice-list';
import { SalesSummaryCard } from '../sales-summary-card';
import { SalesNewInvoiceDialog } from '../sales-new-invoice-dialog';
import { SalesRecordPaymentDialog } from '../sales-record-payment-dialog';
import { SalesReceiptPreviewDialog, buildReceiptHtml } from '../sales-receipt-preview-dialog';

// ======================================================================

export function SalesView() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
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
  const { updateClientFromInvoice, recordPayment: recordClientPayment, getClientByName, updateClient, addClient } = useClients();
  const { deductStockForInvoice, restoreStockForInvoice, products: inventoryProducts } = useInventory();
  const { businessInfo } = useBusiness();
  const { role } = useSettings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Record payment
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);

  // Retail receipt preview
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [receiptShowPayment, setReceiptShowPayment] = useState(false);

  // Printer picker for retail auto-print
  const [printerPickerOpen, setPrinterPickerOpen] = useState(false);
  const pendingPrintInvoiceRef = useRef<Invoice | null>(null);
  const [receiptPrinter, setReceiptPrinter] = useState<string | null>(null);

  // Load saved receipt printer on mount
  useEffect(() => {
    settingsDB.get('receipt_printer').then((val) => {
      if (val) setReceiptPrinter(val);
    });
  }, []);

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
      options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery' | 'receipt'; isRetail?: boolean; autoPrint?: boolean }
    ) => {
      // Stamps the buying price snapshot onto each invoice line item.
      // Priority: FIFO-weighted cost from batch data > current inventory product price > 0.
      // This snapshot must never change after the invoice is saved.
      const stampBuyingPrice = (
        invoiceProducts: typeof data.products,
        pricedItems?: { name: string; unitPrice: number; total: number; buyingPrice: number }[]
      ) => invoiceProducts.map((p) => {
        const fromFifo = pricedItems?.find((pi) => pi.name.toLowerCase() === p.name.toLowerCase());
        if (fromFifo) return { ...p, buyingPrice: fromFifo.buyingPrice };
        const fromInventory = inventoryProducts.find((ip) => ip.name.toLowerCase() === p.name.toLowerCase());
        return { ...p, buyingPrice: fromInventory?.buyingPrice ?? 0 };
      });

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
            const newSubtotal = patchedProducts.reduce((sum, p) => sum + p.total, 0); // HT subtotal = sum of FIFO-priced lines
            const newTvaAmount = newSubtotal * (data.tvaRate / 100); // TVA on top of HT
            const newTotal = newSubtotal + newTvaAmount; // TTC = HT + TVA
            const newAmountPaid = data.status === 'paid' ? newTotal : Math.min(data.amountPaid, newTotal); // added: if fully paid keep amountPaid = new total; else cap at new total
            data = { ...data, products: patchedProducts, total: newTotal, tvaAmount: newTvaAmount, subtotal: newSubtotal, amountPaid: newAmountPaid, amountDue: newTotal - newAmountPaid }; // added: replace data with fully patched invoice before saving
          }

          // Stamp buying price snapshot on every line item (for accurate profit history)
          data = { ...data, products: stampBuyingPrice(data.products, stockResult.pricedItems) };

          updateInvoice(editingInvoice.id, data);
          savedInvoiceId = editingInvoice.id;
          // Sync client balance when payment amounts changed by edit
          const paidDelta = data.amountPaid - editingInvoice.amountPaid;
          const dueDelta = data.amountDue - editingInvoice.amountDue;
          const totalDelta = data.total - editingInvoice.total;
          
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
              totalPurchases: data.total,
              totalPaid: data.amountPaid,
              remainingBalance: data.amountDue,
              lastInvoiceDate: new Date().toISOString().split('T')[0],
              status: data.amountDue <= 0 ? 'paid' : data.amountPaid > 0 ? 'partly-paid' : 'unpaid',
            });
          } else if (paidDelta !== 0 || dueDelta !== 0 || totalDelta !== 0) {
            const newRemainingBalance = Math.max(0, client.remainingBalance + dueDelta);
            const newTotalPurchases = Math.max(0, client.totalPurchases + totalDelta);
            updateClient(client.id, {
              totalPaid: client.totalPaid + paidDelta,
              totalPurchases: newTotalPurchases,
              remainingBalance: newRemainingBalance,
              status: newRemainingBalance <= 0 ? 'paid' : (client.totalPaid + paidDelta) > 0 ? 'partly-paid' : 'unpaid',
            });
          }
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
            const newSubtotal = patchedProducts.reduce((sum, p) => sum + p.total, 0); // HT subtotal = sum of FIFO-priced lines
            const newTvaAmount = newSubtotal * (data.tvaRate / 100); // TVA on top of HT
            const newTotal = newSubtotal + newTvaAmount; // TTC = HT + TVA
            const newAmountPaid = data.status === 'paid' ? newTotal : Math.min(data.amountPaid, newTotal); // added: if fully paid keep amountPaid = new total; else cap at new total
            data = { ...data, products: patchedProducts, total: newTotal, tvaAmount: newTvaAmount, subtotal: newSubtotal, amountPaid: newAmountPaid, amountDue: newTotal - newAmountPaid }; // added: replace data with fully patched invoice before calling addInvoice
          }

          // Stamp buying price snapshot on every line item (for accurate profit history)
          data = { ...data, products: stampBuyingPrice(data.products, stockResult.pricedItems) };

          const newInvoice = addInvoice(data);
          savedInvoiceId = newInvoice.id;

          // Update client record (skip for retail walk-in sales)
          if (!options.isRetail) {
            updateClientFromInvoice(
              data.client.name,
              data.client.phone,
              data.client.address,
              data.total,
              data.amountPaid,
              { nif: data.client.nif, nis: data.client.nis, rc: data.client.rc, ai: data.client.ai }
            );
          }

          showSuccess(t('sales.invoiceCreated'), !options.printMode && !options.isRetail && savedInvoiceId ? {
            label: t('common.view'),
            onClick: () => navigate(`/sales/${savedInvoiceId}`),
          } : undefined);
        }

        setDialogOpen(false);
        setEditingInvoice(null);

        // Show receipt for retail sales
        if (options.isRetail && savedInvoiceId) {
          const savedInvoice = { ...data, id: savedInvoiceId } as Invoice;
          if (options.autoPrint) {
            // Save & Print path
            if (receiptPrinter === 'none') {
              // User opted out of printing — just save, no receipt dialog
            } else if (receiptPrinter) {
              // Printer already saved — print silently
              const html = buildReceiptHtml(savedInvoice, businessInfo, language);
              window.database?.printHtmlSilent(html, receiptPrinter);
            } else {
              // First time — show printer picker
              pendingPrintInvoiceRef.current = savedInvoice;
              setPrinterPickerOpen(true);
            }
          } else {
            // Save only: open the preview dialog
            setReceiptInvoice(savedInvoice);
            setReceiptShowPayment(false);
            setReceiptDialogOpen(true);
          }
        }

        // Show receipt dialog for wholesale receipt mode (reuses retail receipt flow)
        if (options.printMode === 'receipt' && savedInvoiceId) {
          const savedInvoice = { ...data, id: savedInvoiceId } as Invoice;
          setReceiptInvoice(savedInvoice);
          setReceiptShowPayment(true);
          setReceiptDialogOpen(true);
        }

        // Navigate to print if requested (wholesale invoice / delivery)
        if ((options.printMode === 'invoice' || options.printMode === 'delivery') && savedInvoiceId) {
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
      getClientByName,
      updateClient,
      deductStockForInvoice,
      restoreStockForInvoice,
      showSuccess,
      showError,
      navigate,
      receiptPrinter,
      language,
      businessInfo,
    ]
  );

  // Called when the user picks a printer from the first-time dialog
  const handlePrinterSelected = useCallback(
    (printerName: string) => {
      // Save the choice permanently
      setReceiptPrinter(printerName);
      settingsDB.set('receipt_printer', printerName);
      setPrinterPickerOpen(false);

      // Now print the pending invoice silently
      const invoice = pendingPrintInvoiceRef.current;
      if (invoice) {
        const html = buildReceiptHtml(invoice, businessInfo, language);
        window.database?.printHtmlSilent(html, printerName);
        pendingPrintInvoiceRef.current = null;
      }
    },
    [businessInfo, language]
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

      // Revert client's totalPurchases and balance
      const client = getClientByName(invoiceToDelete.client.name);
      if (client) {
        const newTotalPurchases = Math.max(0, client.totalPurchases - invoiceToDelete.total);
        const newTotalPaid = Math.max(0, client.totalPaid - invoiceToDelete.amountPaid);
        const newRemainingBalance = Math.max(0, client.remainingBalance - invoiceToDelete.amountDue);
        updateClient(client.id, {
          totalPurchases: newTotalPurchases,
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'paid' : newTotalPaid > 0 ? 'partly-paid' : 'unpaid',
        });
      }

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

  const WALKIN_NAMES = ['Walk-in Customer', 'Client de passage', 'زبون عابر'];
  const isRetailInvoice = (invoice: Invoice) =>
    invoice.type === 'retail' || WALKIN_NAMES.includes(invoice.client.name);

  const handleRowClick = (invoice: Invoice) => {
    if (isRetailInvoice(invoice)) {
      setReceiptInvoice(invoice);
      setReceiptShowPayment(false);
      setReceiptDialogOpen(true);
    } else {
      navigate(`/sales/${invoice.id}`);
    }
  };

  const handlePrint = (invoice: Invoice) => {
    if (isRetailInvoice(invoice)) {
      setReceiptInvoice(invoice);
      setReceiptShowPayment(false);
      setReceiptDialogOpen(true);
    } else {
      navigate(`/sales/${invoice.id}?print=true`);
    }
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

      {/* Summary Cards — admin only */}
      {role !== 'worker' && (
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
      )}

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

      {/* Retail Receipt Preview Dialog */}
      <SalesReceiptPreviewDialog
        open={receiptDialogOpen}
        onClose={() => {
          setReceiptDialogOpen(false);
          setReceiptInvoice(null);
        }}
        invoice={receiptInvoice}
        businessInfo={businessInfo}
        showPaymentStatus={receiptShowPayment}
      />

      {/* First-time receipt printer picker */}
      <PrinterPickerDialog
        open={printerPickerOpen}
        title={t('sales.chooseReceiptPrinter')}
        subtitle={t('sales.chooseReceiptPrinterSubtitle')}
        noPrinterLabel={t('sales.noPrinter')}
        onSelect={handlePrinterSelected}
        onNoPrinter={() => {
          setReceiptPrinter('none');
          settingsDB.set('receipt_printer', 'none');
          setPrinterPickerOpen(false);
          pendingPrintInvoiceRef.current = null;
        }}
        onClose={() => {
          setPrinterPickerOpen(false);
          pendingPrintInvoiceRef.current = null;
        }}
      />
    </DashboardContent>
  );
}
