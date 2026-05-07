import type { ProductUnit } from 'src/_mock/_data';
import type { Language, ColorMode } from 'src/contexts';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useI18n, ALL_UNITS, useSettings, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ======================================================================

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', code: 'EN', color: '#1976D2' },
  { value: 'fr', label: 'Français', code: 'FR', color: '#D32F2F' },
  { value: 'ar', label: 'العربية', code: 'AR', color: '#2E7D32' },
];

const COLOR_MODE_OPTIONS = [
  { value: 'light', labelKey: 'settings.lightMode', icon: 'solar:sun-bold-duotone' },
  { value: 'dark', labelKey: 'settings.darkMode', icon: 'solar:moon-bold-duotone' },
];

const BUSINESS_MODE_OPTIONS = [
  { value: 'wholesaler', labelKey: 'settings.wholesalerMode', icon: 'solar:box-bold-duotone' },
  { value: 'retailer', labelKey: 'settings.retailerMode', icon: 'solar:shop-bold-duotone' },
];

export function SettingsPreferences() {
  const theme = useTheme();
  const { preferences, updatePreferences } = useSettings();
  const { language, setLanguage } = useI18n();
  const { t } = useTranslation();
  const { showSuccess } = useSnackbar();

  const [prefs, setPrefs] = useState({
    lowStockThreshold: 10,
    showExpenses: true,
    colorMode: 'light' as ColorMode,
    enabledUnits: ALL_UNITS as ProductUnit[],
  });
  const [pendingLanguage, setPendingLanguage] = useState<Language>(language);

  // Load from context on mount
  useEffect(() => {
    setPrefs({
      lowStockThreshold: preferences.lowStockThreshold,
      showExpenses: preferences.showExpenses,
      colorMode: preferences.colorMode,
      enabledUnits: preferences.enabledUnits ?? ALL_UNITS,
    });
    setPendingLanguage(language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (field: string) => () => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs((prev) => ({ ...prev, [field]: Number(e.target.value) }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingLanguage(e.target.value as Language);
  };

  const handleColorModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mode = e.target.value as ColorMode;
    setPrefs((prev) => ({ ...prev, colorMode: mode }));
  };

  // businessMode handler removed

  const handleUnitToggle = (unit: ProductUnit) => () => {
    setPrefs((prev) => {
      const already = prev.enabledUnits.includes(unit);
      // Must keep at least 1 unit enabled
      if (already && prev.enabledUnits.length === 1) return prev;
      return {
        ...prev,
        enabledUnits: already
          ? prev.enabledUnits.filter((u) => u !== unit)
          : [...prev.enabledUnits, unit],
      };
    });
  };

  const handleSave = () => {
    updatePreferences(prefs);
    setLanguage(pendingLanguage);
    showSuccess(t('settings.saved'));
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
        {t('settings.preferences')}
      </Typography>

      <Grid container spacing={3}>
        {/* Language Selector */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label={t('settings.language')}
            value={pendingLanguage}
            onChange={handleLanguageChange}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: option.color,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {option.code}
                  </Box>
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Color Mode Selector */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label={t('settings.colorMode')}
            value={prefs.colorMode}
            onChange={handleColorModeChange}
          >
            {COLOR_MODE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Iconify icon={option.icon} width={20} />
                  {t(option.labelKey)}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Business Mode Selector removed */}

        {/* Toggles */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
            }}
          >
            <FormControlLabel
              control={<Switch checked={prefs.showExpenses} onChange={handleToggle('showExpenses')} />}
              label={
                <Box>
                  <Typography variant="subtitle2">{t('settings.showExpenses')}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('settings.showExpensesDesc')}
                  </Typography>
                </Box>
              }
              sx={{ mx: 0 }}
            />
          </Box>
        </Grid>

        {/* Unit Selection */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              border: `1px solid ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('settings.unitSelection')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              {t('settings.unitSelectionDesc')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {ALL_UNITS.map((unit) => {
                const enabled = prefs.enabledUnits.includes(unit);
                return (
                  <Chip
                    key={unit}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Checkbox
                          checked={enabled}
                          onChange={handleUnitToggle(unit)}
                          size="small"
                          sx={{ p: 0 }}
                        />
                        {t(`units.${unit}`)}
                      </Box>
                    }
                    onClick={handleUnitToggle(unit)}
                    variant={enabled ? 'filled' : 'outlined'}
                    color={enabled ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer', pl: 0.5 }}
                  />
                );
              })}
            </Box>
          </Box>
        </Grid>

        {/* Defaults */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={t('settings.lowStockThreshold')}
            type="number"
            value={prefs.lowStockThreshold}
            onChange={handleChange('lowStockThreshold')}
            helperText={t('inventory.reorderLevel')}
            slotProps={{ htmlInput: { min: 1 } }}
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
