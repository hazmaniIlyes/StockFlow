import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ======================================================================

export function SettingsBusinessInfo() {
  const theme = useTheme();

  const [form, setForm] = useState({
    businessName: 'My Business',
    phone: '0555 00 00 00',
    email: 'contact@mybusiness.dz',
    address: '12 Rue Didouche Mourad, Algiers',
    taxId: '',
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
        Business Information
      </Typography>

      {/* Logo upload area */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
          cursor: 'pointer',
          mb: 3,
          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
        }}
      >
        <Iconify icon="solar:camera-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Upload Logo
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Business Name"
            value={form.businessName}
            onChange={handleChange('businessName')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Tax ID / NIF"
            value={form.taxId}
            onChange={handleChange('taxId')}
            placeholder="e.g. 001216000000000"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Phone"
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Email"
            value={form.email}
            onChange={handleChange('email')}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Address"
            value={form.address}
            onChange={handleChange('address')}
            multiline
            rows={2}
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
