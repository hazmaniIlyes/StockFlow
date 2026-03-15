import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { useTheme } from '@mui/material/styles';

import { useClients, useExpenses, useInventory, useSuppliers, useTranslation } from 'src/contexts';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useInvoices } from 'src/sections/sales/context';

// ======================================================================

export function SettingsReset() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showSuccess } = useSnackbar();

  const {
    tvaDeclarations,
    getTvaCollectedSinceReset,
    declareTVA,
    clearTvaDeclarations,
    clearAll: clearInvoices,
  } = useInvoices();
  const { clearAll: clearInventory } = useInventory();
  const { clearAll: clearClients } = useClients();
  const { clearAll: clearExpenses } = useExpenses();
  const { clearAll: clearSuppliers } = useSuppliers();

  const [invoiceResetOpen, setInvoiceResetOpen] = useState(false);
  const [tvaDialogOpen, setTvaDialogOpen] = useState(false);
  const [stockResetOpen, setStockResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const tvaCollected = getTvaCollectedSinceReset();
  const confirmWord = t('settings.confirmWord');

  const handleResetInvoiceCounter = () => {
    clearInvoices();
    setInvoiceResetOpen(false);
    showSuccess(t('settings.resetSuccessInvoice'));
  };

  const handleDeclareTVA = () => {
    declareTVA(tvaCollected);
    setTvaDialogOpen(false);
    showSuccess(t('settings.resetSuccessTva'));
  };

  const handleResetStock = () => {
    clearInventory();
    setStockResetOpen(false);
    showSuccess(t('settings.resetSuccessStock'));
  };

  const handleClearAll = () => {
    if (confirmText !== confirmWord) return;
    clearInvoices();
    clearInventory();
    clearClients();
    clearExpenses();
    clearSuppliers();
    setConfirmText('');
    showSuccess(t('settings.resetSuccessAll'));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Invoice Counter Reset ── */}
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:hashtag-bold-duotone" width={24} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="fontWeightSemiBold">
              {t('settings.resetInvoiceCounter')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('settings.resetInvoiceCounterDesc')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Iconify icon="solar:restart-bold" width={18} />}
            onClick={() => setInvoiceResetOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            {t('settings.resetInvoiceCounter')}
          </Button>
        </Box>
      </Card>

      {/* ── TVA Declare & Reset ── */}
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'warning.lighter',
              color: 'warning.dark',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:percent-bold-duotone" width={24} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="fontWeightSemiBold">
              {t('settings.resetTva')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('settings.resetTvaDesc')}
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                px: 2,
                py: 1,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t('settings.tvaCollectedSinceReset')}:
              </Typography>
              <Typography variant="subtitle2" color="warning.dark">
                {tvaCollected.toLocaleString('fr-DZ')} DA
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Iconify icon="solar:check-read-bold" width={18} />}
            onClick={() => setTvaDialogOpen(true)}
            disabled={tvaCollected === 0}
            sx={{ flexShrink: 0 }}
          >
            {t('settings.resetTva')}
          </Button>
        </Box>

        {tvaDeclarations.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('settings.tvaHistoryTitle')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('settings.tvaHistoryPeriod')}</TableCell>
                  <TableCell align="right">{t('settings.tvaHistoryAmount')}</TableCell>
                  <TableCell align="right">{t('settings.tvaHistoryDate')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tvaDeclarations.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography variant="caption">{d.period}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight="fontWeightSemiBold">
                        {d.amount.toLocaleString('fr-DZ')} DA
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {d.dateDeclared}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {tvaDeclarations.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
            {t('settings.noTvaDeclarations')}
          </Typography>
        )}
      </Card>

      {/* ── Reset All Stock ── */}
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'error.lighter',
              color: 'error.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:box-bold-duotone" width={24} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="fontWeightSemiBold">
              {t('settings.resetStock')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('settings.resetStockDesc')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:restart-bold" width={18} />}
            onClick={() => setStockResetOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            {t('settings.resetStock')}
          </Button>
        </Box>
      </Card>

      {/* ── Danger Zone — Clear All Data ── */}
      <Card
        sx={{
          p: 3,
          border: `1px solid ${theme.palette.error.main}`,
          bgcolor: `${theme.palette.error.main}14`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Iconify icon="solar:danger-triangle-bold-duotone" width={20} color="error.main" />
          <Typography variant="subtitle1" color="error.main" fontWeight="fontWeightBold">
            {t('settings.dangerZone')}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2, borderColor: `${theme.palette.error.main}40` }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight="fontWeightSemiBold">
              {t('settings.clearAllData')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {t('settings.clearAllDataDesc')}
            </Typography>
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
              {t('settings.clearAllDataWarning')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmWord}
                label={t('settings.typeToConfirm', { word: confirmWord })}
                sx={{ width: 260 }}
                inputProps={{ spellCheck: false }}
              />
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
                disabled={confirmText !== confirmWord}
                onClick={handleClearAll}
              >
                {t('settings.clearAllData')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* ── Invoice Counter Confirm Dialog ── */}
      <Dialog open={invoiceResetOpen} onClose={() => setInvoiceResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.resetInvoiceCounter')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings.resetInvoiceCounterConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceResetOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleResetInvoiceCounter}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── TVA Declare Confirm Dialog ── */}
      <Dialog open={tvaDialogOpen} onClose={() => setTvaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.resetTva')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.resetTvaConfirm', { amount: tvaCollected.toLocaleString('fr-DZ') })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTvaDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="warning" onClick={handleDeclareTVA}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Stock Reset Confirm Dialog ── */}
      <Dialog open={stockResetOpen} onClose={() => setStockResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.resetStock')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings.resetStockConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockResetOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleResetStock}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
