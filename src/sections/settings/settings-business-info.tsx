import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBusiness, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ======================================================================

export function SettingsBusinessInfo() {
  const theme = useTheme();
  const { businessInfo, updateBusinessInfo } = useBusiness();
  const { showSuccess } = useSnackbar();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: '',
    phone: '',
    email: '',
    address: '',
    nif: '',
    nis: '',
    rc: '',
    ai: '',
  });

  // Load from context on mount
  useEffect(() => {
    setForm({
      businessName: businessInfo.businessName,
      phone: businessInfo.phone,
      email: businessInfo.email,
      address: businessInfo.address,
      nif: businessInfo.nif,
      nis: businessInfo.nis,
      rc: businessInfo.rc,
      ai: businessInfo.ai,
    });
  }, [businessInfo]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBusinessInfo({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleRemoveLogo = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    updateBusinessInfo({ logo: undefined });
  };

  const handleSave = () => {
    updateBusinessInfo(form);
    showSuccess(t('settings.businessInfoSaved'));
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
        {t('settings.businessInfo')}
      </Typography>

      {/* Logo upload area */}
      <Box sx={{ position: 'relative', width: 120, mb: 3 }}>
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: businessInfo.logo ? 'primary.main' : 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 0.5,
            cursor: 'pointer',
            overflow: 'hidden',
            '&:hover': { borderColor: 'primary.main', bgcolor: businessInfo.logo ? undefined : 'primary.lighter' },
          }}
        >
          {businessInfo.logo ? (
            <Box
              component="img"
              src={businessInfo.logo}
              alt="logo"
              sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
            />
          ) : (
            <>
              <Iconify icon="solar:camera-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('settings.uploadLogo')}
              </Typography>
            </>
          )}
        </Box>
        {businessInfo.logo && (
          <IconButton
            size="small"
            color="error"
            onClick={handleRemoveLogo}
            sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'error.lighter' } }}
          >
            <Iconify icon="solar:close-circle-bold" width={16} />
          </IconButton>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          style={{ display: 'none' }}
          onChange={handleLogoChange}
        />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.businessName')}
            value={form.businessName}
            onChange={handleChange('businessName')}
            placeholder={t('settings.businessNamePlaceholder')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('common.phone')}
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder={t('settings.phonePlaceholder')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('common.email')}
            value={form.email}
            onChange={handleChange('email')}
            placeholder={t('settings.emailPlaceholder')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('common.address')}
            value={form.address}
            onChange={handleChange('address')}
            placeholder={t('settings.addressPlaceholder')}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('settings.taxInfoTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.taxInfoDesc')}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="NIF"
            value={form.nif}
            onChange={handleChange('nif')}
            placeholder={t('settings.nifPlaceholder')}
            helperText={t('settings.nifHelperText')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="NIS"
            value={form.nis}
            onChange={handleChange('nis')}
            placeholder={t('settings.nisPlaceholder')}
            helperText={t('settings.nisHelperText')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="RC"
            value={form.rc}
            onChange={handleChange('rc')}
            placeholder={t('settings.rcPlaceholder')}
            helperText={t('settings.rcHelperText')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="AI"
            value={form.ai}
            onChange={handleChange('ai')}
            placeholder={t('settings.aiPlaceholder')}
            helperText={t('settings.aiHelperText')}
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
