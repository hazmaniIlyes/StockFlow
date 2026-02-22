import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ======================================================================

export function SettingsPreferences() {
  const theme = useTheme();

  const [prefs, setPrefs] = useState({
    darkMode: false,
    sidebarExpanded: true,
    lowStockThreshold: 10,
    showExpenses: true,
  });

  const handleToggle = (field: string) => () => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs((prev) => ({ ...prev, [field]: e.target.value }));
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
        App Preferences
      </Typography>

      <Grid container spacing={3}>
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
              control={<Switch checked={prefs.darkMode} onChange={handleToggle('darkMode')} />}
              label={
                <Box>
                  <Typography variant="subtitle2">Dark Mode</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Switch between light and dark theme
                  </Typography>
                </Box>
              }
              sx={{ mx: 0 }}
            />

            <FormControlLabel
              control={<Switch checked={prefs.sidebarExpanded} onChange={handleToggle('sidebarExpanded')} />}
              label={
                <Box>
                  <Typography variant="subtitle2">Sidebar Expanded by Default</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Start with sidebar open on login
                  </Typography>
                </Box>
              }
              sx={{ mx: 0 }}
            />

            <FormControlLabel
              control={<Switch checked={prefs.showExpenses} onChange={handleToggle('showExpenses')} />}
              label={
                <Box>
                  <Typography variant="subtitle2">Show Expenses Page</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Show or hide Expenses from the sidebar
                  </Typography>
                </Box>
              }
              sx={{ mx: 0 }}
            />
          </Box>
        </Grid>

        {/* Defaults */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Default Low Stock Threshold"
            type="number"
            value={prefs.lowStockThreshold}
            onChange={handleChange('lowStockThreshold')}
            helperText="Default minimum stock level for new products"
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" startIcon={<Iconify icon="solar:diskette-bold-duotone" width={20} />}>
          Save Preferences
        </Button>
      </Box>
    </Card>
  );
}
