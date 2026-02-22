import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { _clients, _invoices, _paymentHistory } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { ClientsPaymentDialog } from '../clients-payment-dialog';

import { DashboardContent } from 'src/layouts/dashboard';

import type { Client } from 'src/_mock/_data';

// ======================================================================

export function ClientsDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clientData, setClientData] = useState<Client | undefined>(
    _clients.find((c) => c.id === id)
  );
  const [paymentOpen, setPaymentOpen] = useState(false);

  const clientInvoices = useMemo(
    () => (clientData ? _invoices.filter((inv) => inv.client.name === clientData.name) : []),
    [clientData]
  );

  const clientPayments = useMemo(
    () => (clientData ? _paymentHistory.filter((p) => p.clientId === clientData.id) : []),
    [clientData]
  );

  const handlePaymentSubmit = useCallback(
    (clientId: string, amount: number, _note: string) => {
      setClientData((prev) => {
        if (!prev || prev.id !== clientId) return prev;
        const newRemaining = Math.max(0, prev.remainingBalance - amount);
        return {
          ...prev,
          totalPaid: prev.totalPaid + amount,
          remainingBalance: newRemaining,
          status: (newRemaining === 0 ? 'paid' : 'unpaid') as Client['status'],
        };
      });
    },
    []
  );

  if (!clientData) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Client not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/clients')}>
            Back to Clients
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
            onClick={() => navigate('/clients')}
          >
            Back
          </Button>
          <Typography variant="h4">{clientData.name}</Typography>
          <Label
            color={clientData.status === 'paid' ? 'success' : 'error'}
            sx={{ ml: 1 }}
          >
            {clientData.status === 'paid' ? 'Paid' : 'Unpaid'}
          </Label>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {clientData.remainingBalance > 0 && (
            <>
              <Button
                variant="outlined"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={20} />}
                onClick={() => {
                  handlePaymentSubmit(clientData.id, clientData.remainingBalance, 'Cleared full balance');
                }}
              >
                Clear Balance
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:wallet-money-bold-duotone" width={20} />}
                onClick={() => setPaymentOpen(true)}
              >
                Record Payment
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Client Info */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="subtitle1">{clientData.phone}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Address
              </Typography>
              <Typography variant="subtitle1">{clientData.address}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Last Invoice
              </Typography>
              <Typography variant="subtitle1">{fDate(clientData.lastInvoiceDate)}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Total Purchases
              </Typography>
              <Typography variant="h5">{fCurrency(clientData.totalPurchases)}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="h5" color="success.main">
                {fCurrency(clientData.totalPaid)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Remaining Balance
              </Typography>
              <Typography
                variant="h5"
                color={clientData.remainingBalance > 0 ? 'error.main' : 'success.main'}
              >
                {fCurrency(clientData.remainingBalance)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Invoices */}
      <Card sx={{ mb: 3 }} id="invoices">
        <CardHeader title="Invoices" subheader={`${clientInvoices.length} invoices`} />
        <Scrollbar>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Unpaid</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
              {clientInvoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  hover
                  onClick={() => navigate(`/sales/${inv.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{inv.invoiceNumber}</Box>
                  </TableCell>
                  <TableCell>{fDate(inv.createdAt)}</TableCell>
                  <TableCell align="right">{fCurrency(inv.total)}</TableCell>
                  <TableCell align="right">{fCurrency(inv.amountPaid)}</TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        typography: 'subtitle2',
                        color: inv.amountDue > 0 ? 'error.main' : 'text.primary',
                      }}
                    >
                      {fCurrency(inv.amountDue)}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Label
                      color={
                        inv.status === 'paid'
                          ? 'success'
                          : inv.status === 'partly-paid'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {inv.status === 'paid' ? 'Paid' : inv.status === 'partly-paid' ? 'Partly' : 'Unpaid'}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader title="Payment History" subheader={`${clientPayments.length} payments`} />
        <Scrollbar>
          <Table sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No payments recorded
                  </TableCell>
                </TableRow>
              )}
              {clientPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{fDate(payment.date)}</TableCell>
                  <TableCell>
                    <Box sx={{ typography: 'subtitle2' }}>{payment.invoiceNumber}</Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ typography: 'subtitle2', color: 'success.main' }}>
                      +{fCurrency(payment.amount)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ color: 'text.secondary' }}>{payment.note}</Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* Payment Dialog */}
      <ClientsPaymentDialog
        open={paymentOpen}
        client={clientData}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePaymentSubmit}
      />
    </DashboardContent>
  );
}
