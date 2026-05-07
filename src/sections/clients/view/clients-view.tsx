import type { Client } from 'src/_mock/_data';

import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useClients, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/confirm-dialog';

import { useInvoices } from 'src/sections/sales/context';

import { ClientsTable } from '../clients-table';
import { ClientsKpiCards } from '../clients-kpi-cards';
import { ClientsNewDialog } from '../clients-new-dialog';
import { ClientsPaymentDialog } from '../clients-payment-dialog';

// ======================================================================

export function ClientsView() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useSnackbar();
  const { clients, addClient, updateClient, deleteClient, recordPayment } = useClients();
  const { invoices, recordPayment: recordInvoicePayment } = useInvoices();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // KPI calculations - now dynamic from actual data
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const unpaidClients = clients.filter((c) => c.status === 'unpaid' || c.status === 'partly-paid').length;
    const totalCredit = clients.reduce((sum, c) => sum + c.remainingBalance, 0);

    // Overdue = unpaid invoices past their due date
    const now = new Date();
    const overdueAmount = invoices
      .filter((inv) => inv.amountDue > 0 && new Date(inv.dueDate) < now)
      .reduce((sum, inv) => sum + inv.amountDue, 0);

    return { totalClients, unpaidClients, totalCredit, overdueAmount };
  }, [clients, invoices]);

  const handleNewClient = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleSave = useCallback(
    (data: { name: string; phone: string; address: string; nif?: string; nis?: string; rc?: string; ai?: string }) => {
      try {
        if (editingClient) {
          updateClient(editingClient.id, data);
          showSuccess(t('clients.clientUpdated'));
        } else {
          addClient({
            ...data,
            totalPurchases: 0,
            totalPaid: 0,
            remainingBalance: 0,
            lastInvoiceDate: '',
            status: 'paid',
          });
          showSuccess(t('clients.clientAdded'));
        }
        setDialogOpen(false);
        setEditingClient(null);
      } catch (e) {
        showError(t('clients.failedToSave'));
      }
    },
    [editingClient, addClient, updateClient, showSuccess, showError, t]
  );

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleViewInvoices = (client: Client) => {
    navigate(`/clients/${client.id}#invoices`);
  };

  const handleRecordPaymentRequest = (client: Client) => {
    setPaymentClient(client);
  };

  const handlePaymentSubmit = useCallback(
    (clientId: string, amount: number, _note: string) => {
      recordPayment(clientId, amount);
      // Distribute payment across the client's unpaid invoices (oldest first)
      const clientName = clients.find((c) => c.id === clientId)?.name;
      if (clientName) {
        const unpaid = invoices
          .filter((inv) => inv.client.name === clientName && inv.amountDue > 0)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        let remaining = amount;
        for (const inv of unpaid) {
          if (remaining <= 0) break;
          const toApply = Math.min(remaining, inv.amountDue);
          recordInvoicePayment(inv.id, toApply);
          remaining -= toApply;
        }
      }
      showSuccess(t('clients.paymentRecorded', { amount: amount.toLocaleString() }));
    },
    [recordPayment, recordInvoicePayment, clients, invoices, showSuccess, t]
  );

  const handleDeleteRequest = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientToDelete(client);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete.id);
      showSuccess(t('clients.clientDeleted'));
      setDeleteDialogOpen(false);
      setClientToDelete(null);
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
        <Typography variant="h4">{t('clients.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:user-plus-bold-duotone" width={20} />}
          onClick={handleNewClient}
        >
          {t('clients.newClient')}
        </Button>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mb: 3 }}>
        <ClientsKpiCards
          totalClients={kpis.totalClients}
          unpaidClients={kpis.unpaidClients}
          totalCredit={kpis.totalCredit}
          overdueAmount={kpis.overdueAmount}
        />
      </Box>

      {/* Client List */}
      <ClientsTable
        clients={clients}
        invoices={invoices}
        onView={handleView}
        onViewInvoices={handleViewInvoices}
        onRecordPayment={handleRecordPaymentRequest}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {/* New/Edit Client Dialog */}
      <ClientsNewDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        editClient={editingClient}
      />

      {/* Payment Dialog */}
      <ClientsPaymentDialog
        open={Boolean(paymentClient)}
        client={paymentClient}
        onClose={() => setPaymentClient(null)}
        onSubmit={handlePaymentSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('clients.deleteClient')}
        content={t('clients.confirmDeleteContent', { name: clientToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setClientToDelete(null);
        }}
      />
    </DashboardContent>
  );
}
