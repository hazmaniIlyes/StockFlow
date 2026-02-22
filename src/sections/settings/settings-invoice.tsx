import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ======================================================================

export function SettingsInvoice() {
  const theme = useTheme();

  const [form, setForm] = useState({
    tvaRate: 19,
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1011,
    paymentTerms: 30,
    currency: 'DA',
    footerNote: 'Thank you for your business.',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
        Invoice Settings
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Default TVA Rate (%)"
            type="number"
            value={form.tvaRate}
            onChange={handleChange('tvaRate')}
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Currency"
            select
            value={form.currency}
            onChange={handleChange('currency')}
          >
            <MenuItem value="DA">DA — Algerian Dinar</MenuItem>
            <MenuItem value="USD">USD — US Dollar</MenuItem>
            <MenuItem value="EUR">EUR — Euro</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Invoice Prefix"
            value={form.invoicePrefix}
            onChange={handleChange('invoicePrefix')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Next Invoice Number"
            type="number"
            value={form.nextInvoiceNumber}
            onChange={handleChange('nextInvoiceNumber')}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Payment Terms"
            select
            value={form.paymentTerms}
            onChange={handleChange('paymentTerms')}
          >
            <MenuItem value={15}>Net 15 — Due in 15 days</MenuItem>
            <MenuItem value={30}>Net 30 — Due in 30 days</MenuItem>
            <MenuItem value={60}>Net 60 — Due in 60 days</MenuItem>
            <MenuItem value={90}>Net 90 — Due in 90 days</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Invoice Footer Note"
            value={form.footerNote}
            onChange={handleChange('footerNote')}
            multiline
            rows={2}
            placeholder="e.g. Thank you for your business."
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" startIcon={<Iconify icon="solar:diskette-bold-duotone" width={20} />}>
          Save Changes
        </Button>
      </Box>
    </Card>
  );
}
