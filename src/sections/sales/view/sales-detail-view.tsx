import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
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

import { _invoices } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { DashboardContent } from 'src/layouts/dashboard';

// ======================================================================

export function SalesDetailView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const invoice = _invoices.find((inv) => inv.id === id);

  const shouldPrint = searchParams.get('print') === 'true';

  useEffect(() => {
    if (shouldPrint && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [shouldPrint, invoice]);

  if (!invoice) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Invoice not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/sales')}>
            Back to Sales
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
    if (status === 'paid') return 'Paid';
    if (status === 'partly-paid') return 'Partly Paid';
    return 'Unpaid';
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    window.print();
  };

  return (
    <DashboardContent maxWidth="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
            onClick={() => navigate('/sales')}
          >
            Back
          </Button>
          <Typography variant="h4">{invoice.invoiceNumber}</Typography>
          <Label color={statusColor(invoice.status)} sx={{ ml: 1 }}>
            {statusLabel(invoice.status)}
          </Label>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:download-minimalistic-bold-duotone" width={20} />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>
      </Box>

      {/* Invoice Content */}
      <Card ref={printRef} sx={{ p: { xs: 3, md: 5 } }}>
        {/* Invoice Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              INVOICE
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {invoice.invoiceNumber}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Date
            </Typography>
            <Typography variant="subtitle1">{fDate(invoice.createdAt)}</Typography>
          </Box>
        </Box>

        {/* Client Info */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Bill To
            </Typography>
            <Typography variant="subtitle1">{invoice.client.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.client.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {invoice.client.address}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Payment Status
              </Typography>
              <Label color={statusColor(invoice.status)} sx={{ fontSize: '0.875rem', py: 1, px: 2 }}>
                {statusLabel(invoice.status)}
              </Label>
              {invoice.status === 'partly-paid' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Paid: {fCurrency(invoice.amountPaid)} · Due:{' '}
                    <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
                      {fCurrency(invoice.amountDue)}
                    </Box>
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Products Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '40%' }}>Product</TableCell>
              <TableCell align="center">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Typography variant="subtitle2">{product.name}</Typography>
                </TableCell>
                <TableCell align="center">{product.quantity}</TableCell>
                <TableCell align="right">{fCurrency(product.unitPrice)}</TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">{fCurrency(product.total)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2">{fCurrency(invoice.subtotal)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                TVA ({invoice.tvaRate}%)
              </Typography>
              <Typography variant="body2">{fCurrency(invoice.tvaAmount)}</Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6">{fCurrency(invoice.total)}</Typography>
            </Box>

            {invoice.status !== 'paid' && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="body2">{fCurrency(invoice.amountPaid)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" color="error.main">
                    Amount Due
                  </Typography>
                  <Typography variant="subtitle1" color="error.main">
                    {fCurrency(invoice.amountDue)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Card>
    </DashboardContent>
  );
}
