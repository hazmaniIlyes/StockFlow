import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ======================================================================

export function SettingsInvoice() {
  const theme = useTheme();
  const { invoice, updateInvoiceSettings } = useSettings();
  const { showSuccess } = useSnackbar();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    tvaRate: 19,
    invoicePrefix: 'INV-',
    paymentTerms: 30,
    currency: 'DA',
    footerNote: 'Thank you for your business.',
  });

  // Load from context on mount
  useEffect(() => {
    setForm({
      tvaRate: invoice.tvaRate,
      invoicePrefix: invoice.invoicePrefix,
      paymentTerms: invoice.paymentTerms,
      currency: invoice.currency,
      footerNote: invoice.footerNote,
    });
  }, [invoice]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'tvaRate' || field === 'paymentTerms' 
      ? Number(e.target.value) 
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateInvoiceSettings(form);
    showSuccess(t('settings.invoiceSettingsSaved'));
  };

  return (
    <Card
      sx={{
        p: 3,
        boxShadow: theme.vars.customShadows.z8,
        border: `1px solid ${theme.vars.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3 }}>
        {t('settings.invoiceSettings')}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.defaultTvaRate')}
            type="number"
            value={form.tvaRate}
            onChange={handleChange('tvaRate')}
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.currency')}
            select
            value={form.currency}
            onChange={handleChange('currency')}
          >
            <MenuItem value="DA">{t('settings.currencyDA')}</MenuItem>
            <MenuItem value="USD">{t('settings.currencyUSD')}</MenuItem>
            <MenuItem value="EUR">{t('settings.currencyEUR')}</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.invoicePrefix')}
            value={form.invoicePrefix}
            onChange={handleChange('invoicePrefix')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.paymentTermsLabel')}
            select
            value={form.paymentTerms}
            onChange={handleChange('paymentTerms')}
          >
            <MenuItem value={15}>{t('settings.net15')}</MenuItem>
            <MenuItem value={30}>{t('settings.net30')}</MenuItem>
            <MenuItem value={60}>{t('settings.net60')}</MenuItem>
            <MenuItem value={90}>{t('settings.net90')}</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={t('settings.footerNote')}
            value={form.footerNote}
            onChange={handleChange('footerNote')}
            multiline
            rows={2}
            placeholder={t('settings.footerNotePlaceholder')}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:diskette-bold-duotone" width={20} />}
          onClick={handleSave}
        >
          {t('settings.saveChanges')}
        </Button>
      </Box>
    </Card>
  );
}
