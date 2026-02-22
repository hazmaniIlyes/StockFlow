import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { _invoices, _salesSummary } from 'src/_mock';

import { Iconify } from 'src/components/iconify';

import { DashboardContent } from 'src/layouts/dashboard';

import { SalesInvoiceList } from '../sales-invoice-list';
import { SalesNewInvoiceDialog } from '../sales-new-invoice-dialog';
import { SalesSummaryCard } from '../sales-summary-card';

import type { Invoice } from 'src/_mock/_data';

// ======================================================================

export function SalesView() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>(_invoices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setDialogOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDialogOpen(true);
  };

  const handleSave = useCallback(
    (data: Omit<Invoice, 'id'>) => {
      if (editingInvoice) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === editingInvoice.id ? { ...inv, ...data } : inv))
        );
      } else {
        const newInvoice: Invoice = { ...data, id: `inv-${Date.now()}` };
        setInvoices((prev) => [newInvoice, ...prev]);
      }
      setDialogOpen(false);
      setEditingInvoice(null);
    },
    [editingInvoice]
  );

  const handleDelete = useCallback((invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
  }, []);

  const handleRowClick = (invoice: Invoice) => {
    navigate(`/sales/${invoice.id}`);
  };

  const handlePrint = (invoice: Invoice) => {
    navigate(`/sales/${invoice.id}?print=true`);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Sales / Invoicing</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" width={20} />}
          onClick={handleNewInvoice}
        >
          New Invoice
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SalesSummaryCard
            title="Today Sales"
            total={_salesSummary.today.totalSales}
            profit={_salesSummary.today.profit}
            count={_salesSummary.today.count}
            icon="solar:dollar-minimalistic-bold-duotone"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SalesSummaryCard
            title="Pending Payments"
            total={_salesSummary.pending.totalAmount}
            count={_salesSummary.pending.count}
            icon="solar:clock-circle-bold-duotone"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SalesSummaryCard
            title="This Month Sales"
            total={_salesSummary.thisMonth.totalSales}
            profit={_salesSummary.thisMonth.profit}
            count={_salesSummary.thisMonth.count}
            icon="solar:graph-up-bold-duotone"
            color="success"
          />
        </Grid>
      </Grid>

      {/* Invoice List */}
      <SalesInvoiceList
        invoices={invoices}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
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
    </DashboardContent>
  );
}
