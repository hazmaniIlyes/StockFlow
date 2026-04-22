import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { useClients, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import TablePagination from '@mui/material/TablePagination';

import { Label } from 'src/components/label';
import { useSnackbar } from 'src/components/snackbar';

import { useInvoices } from 'src/sections/sales/context';

import { ClientsPaymentDialog } from '../clients-payment-dialog';

import { DashboardContent } from 'src/layouts/dashboard';

// ======================================================================

type ActivityItem = {
  id: string;
  type: 'invoice' | 'payment';
  date: string;
  description: string;
  amount: number;
  status?: 'paid' | 'partly-paid' | 'unpaid';
  invoiceId?: string;
  invoiceNumber?: string;
};

export function ClientsDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, dir } = useTranslation();
  const { showSuccess } = useSnackbar();
  const { getClient, recordPayment } = useClients();
  const { invoices, recordPayment: recordInvoicePayment } = useInvoices();

  const clientData = getClient(id || '');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activityPage, setActivityPage] = useState(0);
  const activityRowsPerPage = 10;

  const clientInvoices = useMemo(
    () => (clientData ? invoices.filter((inv) => inv.client.name === clientData.name) : []),
    [clientData, invoices]
  );

  // Build unified activity timeline
  const activityTimeline = useMemo(() => {
    if (!clientData) return [];

    const activities: ActivityItem[] = [];

    // Add invoices
    clientInvoices.forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        date: inv.createdAt,
        description: `Invoice ${inv.invoiceNumber}`,
        amount: inv.total,
        status: inv.status,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
      });

      // Add payment for this invoice if paid
      if (inv.amountPaid > 0) {
        activities.push({
          id: `pay-${inv.id}`,
          type: 'payment',
          date: inv.createdAt, // Same date for now
          description: `Payment for ${inv.invoiceNumber}`,
          amount: inv.amountPaid,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
        });
      }
    });

    // Sort by date descending (newest first)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clientData, clientInvoices]);

  // Quick stats
  const stats = useMemo(() => {
    if (!clientData || clientInvoices.length === 0) {
      return {
        totalInvoices: 0,
        avgOrderValue: 0,
        lastPurchase: null,
      };
    }

    const total = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const sortedByDate = [...clientInvoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      totalInvoices: clientInvoices.length,
      avgOrderValue: total / clientInvoices.length,
      lastPurchase: sortedByDate[0]?.createdAt || null,
    };
  }, [clientData, clientInvoices]);

  const nearestDueDate = useMemo(() => {
    const unpaid = clientInvoices.filter((inv) => inv.amountDue > 0 && inv.dueDate);
    if (unpaid.length === 0) return null;
    const sorted = [...unpaid].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return sorted[0].dueDate;
  }, [clientInvoices]);

  const handlePaymentSubmit = useCallback(
    (clientId: string, amount: number, _note: string) => {
      recordPayment(clientId, amount);
      // Distribute payment across the client's unpaid invoices (oldest first)
      if (clientData) {
        const unpaid = clientInvoices
          .filter((inv) => inv.amountDue > 0)
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
    [recordPayment, recordInvoicePayment, clientData, clientInvoices, showSuccess, t]
  );

  const handleClearBalance = () => {
    if (clientData && clientData.remainingBalance > 0) {
      handlePaymentSubmit(clientData.id, clientData.remainingBalance, t('clients.clearFullBalance'));
    }
  };

  if (!clientData) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {t('clients.clientNotFound')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/clients')}>
            {t('clients.backToClients')}
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {/* Back button */}
      <Button
        variant="text"
        color="inherit"
        startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
        onClick={() => navigate('/clients')}
        sx={{ alignSelf: 'flex-start', mb: 1 }}
      >
        {t('clients.backToClients')}
      </Button>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4">{clientData.name}</Typography>
            <Label color={clientData.remainingBalance > 0 ? 'error' : 'success'}>
              {clientData.remainingBalance > 0 ? t('clients.hasDebt') : t('sales.paid')}
            </Label>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary', flexWrap: 'wrap' }}>
            {clientData.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="solar:phone-bold-duotone" width={16} />
                <Typography variant="body2">{clientData.phone}</Typography>
              </Box>
            )}
            {clientData.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="solar:map-point-bold-duotone" width={16} />
                <Typography variant="body2">{clientData.address}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:document-add-bold-duotone" width={20} />}
            onClick={() => navigate('/sales?newInvoice=true')}
          >
            {t('clients.createInvoice')}
          </Button>
          {clientData.remainingBalance > 0 && (
            <>
              <Button
                variant="outlined"
                color="success"
                startIcon={<Iconify icon="solar:check-circle-bold-duotone" width={20} />}
                onClick={handleClearBalance}
              >
                {t('clients.clearBalance')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:wallet-money-bold-duotone" width={20} />}
                onClick={() => setPaymentOpen(true)}
              >
                {t('clients.recordPayment')}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Financial Summary - 2 Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:cart-large-bold-duotone" width={32} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('clients.totalPurchased')}
              </Typography>
              <Typography variant="h4">{fCurrency(clientData.totalPurchases)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalInvoices} {stats.totalInvoices !== 1 ? t('clients.invoices') : t('clients.invoice')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: alpha(clientData.remainingBalance > 0 ? theme.palette.error.main : theme.palette.success.main, 0.16),
              boxShadow: theme.vars.customShadows.z8,
              border: `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: clientData.remainingBalance > 0 ? 'error.main' : 'success.main',
                color: clientData.remainingBalance > 0 ? 'error.contrastText' : 'success.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify
                icon={
                  clientData.remainingBalance > 0
                    ? 'solar:wallet-money-bold-duotone'
                    : 'solar:check-circle-bold-duotone'
                }
                width={32}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('clients.balanceDue')}
              </Typography>
              <Typography
                variant="h4"
                color={clientData.remainingBalance > 0 ? 'error.main' : 'success.main'}
              >
                {fCurrency(clientData.remainingBalance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {clientData.remainingBalance > 0
                  ? `${fCurrency(clientData.totalPaid)} ${t('clients.paidSoFar')}`
                  : t('clients.allPaymentsReceived')}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Activity Timeline */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardHeader
              title={t('clients.recentActivity')}
              subheader={`${activityTimeline.length} ${t('clients.activities')}`}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.16),
                    color: 'info.main',
                  }}
                >
                  <Iconify icon="solar:history-bold-duotone" width={22} />
                </Box>
              }
            />
            <>
              <Box sx={{ p: 3, pt: 0 }}>
                {activityTimeline.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Iconify icon="solar:inbox-bold-duotone" width={48} sx={{ mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">{t('clients.noActivity')}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative' }}>
                    {/* Timeline line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        insetInlineStart: 15,
                        top: 24,
                        bottom: 24,
                        width: 2,
                        bgcolor: 'divider',
                      }}
                    />

                    {activityTimeline.slice(activityPage * activityRowsPerPage, (activityPage + 1) * activityRowsPerPage).map((activity) => (
                      <Box
                        key={activity.id}
                        sx={{
                          display: 'flex',
                          gap: 2,
                          py: 1.5,
                          position: 'relative',
                          cursor: activity.invoiceId ? 'pointer' : 'default',
                          '&:hover': activity.invoiceId
                            ? {
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                mx: -1,
                                px: 1,
                              }
                            : {},
                        }}
                        onClick={() => {
                          if (activity.invoiceId) {
                            navigate(`/sales/${activity.invoiceId}`);
                          }
                        }}
                      >
                        {/* Timeline dot */}
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            bgcolor:
                              activity.type === 'payment'
                                ? 'success.main'
                                : alpha(
                                    activity.status === 'paid'
                                      ? theme.palette.success.main
                                      : activity.status === 'partly-paid'
                                        ? theme.palette.warning.main
                                        : theme.palette.error.main,
                                    0.16
                                  ),
                            color:
                              activity.type === 'payment'
                                ? 'success.contrastText'
                                : activity.status === 'paid'
                                  ? 'success.main'
                                  : activity.status === 'partly-paid'
                                    ? 'warning.main'
                                    : 'error.main',
                            zIndex: 1,
                          }}
                        >
                          <Iconify
                            icon={
                              activity.type === 'payment'
                                ? 'solar:check-circle-bold'
                                : 'solar:document-text-bold'
                            }
                            width={16}
                          />
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="subtitle2">{activity.description}</Typography>
                            <Typography
                              variant="subtitle2"
                              color={activity.type === 'payment' ? 'success.main' : 'text.primary'}
                            >
                              {activity.type === 'payment' ? '+' : ''}
                              {fCurrency(activity.amount)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {fDate(activity.date)}
                            </Typography>
                            {activity.type === 'invoice' && activity.status && (
                              <Label
                                color={
                                  activity.status === 'paid'
                                    ? 'success'
                                    : activity.status === 'partly-paid'
                                      ? 'warning'
                                      : 'error'
                                }
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              >
                                {activity.status === 'paid'
                                  ? t('sales.paid')
                                  : activity.status === 'partly-paid'
                                    ? t('sales.partial')
                                    : t('sales.unpaid')}
                              </Label>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
            <TablePagination
              component="div"
              count={activityTimeline.length}
              page={activityPage}
              onPageChange={(_e, newPage) => setActivityPage(newPage)}
              rowsPerPage={activityRowsPerPage}
              rowsPerPageOptions={[10]}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
              dir={dir}
            />
          </Card>
        </Grid>

        {/* Right Column - Quick Stats */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={t('clients.quickStats')}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.16),
                    color: 'warning.main',
                  }}
                >
                  <Iconify icon="solar:chart-2-bold-duotone" width={22} />
                </Box>
              }
            />
            <Divider />
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('clients.totalInvoices')}
                </Typography>
                <Typography variant="subtitle1">{stats.totalInvoices}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('clients.avgOrderValue')}
                </Typography>
                <Typography variant="subtitle1">{fCurrency(stats.avgOrderValue)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('clients.lastPurchase')}
                </Typography>
                <Typography variant="subtitle1">
                  {stats.lastPurchase ? fDate(stats.lastPurchase) : '—'}
                </Typography>
              </Box>
              {nearestDueDate && (() => {
                const due = new Date(nearestDueDate);
                const now = new Date();
                const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;
                const isSoon = diffDays >= 0 && diffDays <= 7;
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Iconify
                        icon={isOverdue ? 'solar:danger-triangle-bold' : 'solar:calendar-bold-duotone'}
                        width={16}
                        sx={{ color: isOverdue ? 'error.main' : isSoon ? 'warning.main' : 'text.secondary' }}
                      />
                      <Typography variant="body2" color={isOverdue ? 'error.main' : isSoon ? 'warning.main' : 'text.secondary'}>
                        {isOverdue ? 'Payment Overdue' : 'Next Due Date'}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" color={isOverdue ? 'error.main' : isSoon ? 'warning.main' : 'text.primary'} fontWeight={isOverdue || isSoon ? 700 : 400}>
                      {isOverdue ? `${Math.abs(diffDays)}d ago` : isSoon ? `In ${diffDays}d` : fDate(nearestDueDate)}
                    </Typography>
                  </Box>
                );
              })()}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('clients.totalPaid')}
                </Typography>
                <Typography variant="subtitle1" color="success.main">
                  {fCurrency(clientData.totalPaid)}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader
              title={t('clients.contactInfo')}
              avatar={
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon="solar:user-bold-duotone" width={22} />
                </Box>
              }
            />
            <Divider />
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {clientData.phone && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('common.phone')}
                  </Typography>
                  <Typography variant="body2">{clientData.phone}</Typography>
                </Box>
              )}
              {clientData.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('common.address')}
                  </Typography>
                  <Typography variant="body2">{clientData.address}</Typography>
                </Box>
              )}
              {!clientData.phone && !clientData.address && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {t('clients.noContactInfo')}
                </Typography>
              )}

              {/* Tax Information */}
              {(clientData.nif || clientData.nis || clientData.rc || clientData.ai) && (
                <>
                  <Divider />
                  <Typography variant="caption" color="text.secondary">
                    {t('clients.taxInfo')}
                  </Typography>
                  {clientData.nif && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('clients.taxFields.nif')}
                      </Typography>
                      <Typography variant="body2">{clientData.nif}</Typography>
                    </Box>
                  )}
                  {clientData.nis && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('clients.taxFields.nis')}
                      </Typography>
                      <Typography variant="body2">{clientData.nis}</Typography>
                    </Box>
                  )}
                  {clientData.rc && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('clients.taxFields.rc')}
                      </Typography>
                      <Typography variant="body2">{clientData.rc}</Typography>
                    </Box>
                  )}
                  {clientData.ai && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('clients.taxFields.ai')}
                      </Typography>
                      <Typography variant="body2">{clientData.ai}</Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

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
