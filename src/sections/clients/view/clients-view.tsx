import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { _clients, _invoices } from 'src/_mock';

import { DashboardContent } from 'src/layouts/dashboard';

import { ClientsKpiCards } from '../clients-kpi-cards';
import { ClientsPaymentDialog } from '../clients-payment-dialog';
import { ClientsTable } from '../clients-table';

import type { Client } from 'src/_mock/_data';

// ======================================================================

export function ClientsView() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>(_clients);
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalClients = clients.length;
    const unpaidClients = clients.filter((c) => c.status === 'unpaid').length;
    const totalCredit = clients.reduce((sum, c) => sum + c.remainingBalance, 0);

    // Overdue = unpaid invoices past their due date
    const now = new Date();
    const overdueAmount = _invoices
      .filter((inv) => inv.amountDue > 0 && new Date(inv.dueDate) < now)
      .reduce((sum, inv) => sum + inv.amountDue, 0);

    return { totalClients, unpaidClients, totalCredit, overdueAmount };
  }, [clients]);

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleViewInvoices = (client: Client) => {
    navigate(`/clients/${client.id}#invoices`);
  };

  const handleRecordPayment = (client: Client) => {
    setPaymentClient(client);
  };

  const handlePaymentSubmit = useCallback((clientId: string, amount: number, _note: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const newRemaining = Math.max(0, c.remainingBalance - amount);
        return {
          ...c,
          totalPaid: c.totalPaid + amount,
          remainingBalance: newRemaining,
          status: (newRemaining === 0 ? 'paid' : 'unpaid') as Client['status'],
        };
      })
    );
  }, []);

  const handleEdit = (client: Client) => {
    console.log('Edit client:', client.name);
  };

  const handleDelete = useCallback((clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Clients</Typography>
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
        onView={handleView}
        onViewInvoices={handleViewInvoices}
        onRecordPayment={handleRecordPayment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Payment Dialog */}
      <ClientsPaymentDialog
        open={Boolean(paymentClient)}
        client={paymentClient}
        onClose={() => setPaymentClient(null)}
        onSubmit={handlePaymentSubmit}
      />
    </DashboardContent>
  );
}
