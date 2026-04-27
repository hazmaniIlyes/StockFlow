import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useTranslation, useSettings } from 'src/contexts';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { settingsDB, isElectron, productsDB, clientsDB, suppliersDB, invoicesDB, expensesDB, tvaDB } from 'src/services/db'; // Import our new database service

// ======================================================================

export const ACCOUNT_STORAGE_KEY = 'account'; // New unified JSON string
const DEFAULT_ADMIN_PASSWORD = 'admin';

// Top-level IIFE bootstrapper dynamically caches the unified payload synchronously for password validation
if (isElectron()) {
  settingsDB.get(ACCOUNT_STORAGE_KEY).then((accStr) => {
    if (accStr) {
       localStorage.setItem(ACCOUNT_STORAGE_KEY, accStr); // Caches unified JSON map
    }
  }).catch((err) => window.appLog?.error(err));
}

// Synchronous function remains for UI compatibility, parsing directly from the populated unified cache
export function getAdminPassword(): string {
  try {
    const accStr = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (accStr) {
      const acc = JSON.parse(accStr);
      if (acc.password) return String(acc.password);
    }
  } catch {
    // ignore parsing errors
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function SettingsAccount() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { t } = useTranslation();
  const { role, setRole, workerModeEnabled, setWorkerModeEnabled } = useSettings();
  const isWorker = workerModeEnabled;

  const [resetOnboardingOpen, setResetOnboardingOpen] = useState(false);

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(ACCOUNT_STORAGE_KEY); // Read directly from unified cache
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc.displayName) return { displayName: String(acc.displayName) };
      }
    } catch {
      // Ignore
    }
    return { displayName: 'Admin' };
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  // Re-hydrate the UI specifically when the user opens the settings page
  useEffect(() => {
    if (!isElectron()) return;
    async function loadData() {
      try {
        const accStr = await settingsDB.get(ACCOUNT_STORAGE_KEY); // Fetch new unified object natively
        if (accStr) {
          const acc = JSON.parse(accStr);
          if (acc.displayName) setProfile({ displayName: acc.displayName }); // Hydrate explicit property correctly
        }
      } catch (e) {
        window.appLog?.error('Failed to reload profile from DB:', e);
      }
    }
    loadData();
  }, []);

  const handleProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev: typeof profile) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async () => { 
    let accountObj: Record<string, any> = {};

    // 1. Safely retrieve the existing unified block directly to prevent overwriting parallel configurations
    if (isElectron()) {
      const existingStr = await settingsDB.get(ACCOUNT_STORAGE_KEY);
      if (existingStr) accountObj = JSON.parse(existingStr);
    } else {
      const existingStr = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (existingStr) accountObj = JSON.parse(existingStr);
    }
    
    // 2. Commit the explicitly changed state variable cleanly 
    accountObj.displayName = profile.displayName;
    const unifiedJsonStr = JSON.stringify(accountObj);
    
    // 3. Write unified package payload natively to SQLite 
    if (isElectron()) await settingsDB.set(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
    else localStorage.setItem(ACCOUNT_STORAGE_KEY, unifiedJsonStr);

    // 4. Update the centralized local cache
    localStorage.setItem(ACCOUNT_STORAGE_KEY, unifiedJsonStr); // Instant visual cache sync
    
    showSuccess(t('settings.profileSaved'));
  };

  const handleChangePassword = async () => { 
    const storedPassword = getAdminPassword();
    if (passwords.current !== storedPassword) {
      showError(t('settings.wrongCurrentPassword'));
      return;
    }
    
    // 1. Request existing unified SQLite block efficiently
    let accountObj: Record<string, any> = {};
    if (isElectron()) {
      const existingStr = await settingsDB.get(ACCOUNT_STORAGE_KEY);
      if (existingStr) accountObj = JSON.parse(existingStr);
    } else {
      const existingStr = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (existingStr) accountObj = JSON.parse(existingStr);
    }
    
    // 2. Re-assign newly parsed password logic seamlessly
    accountObj.password = passwords.newPass;
    const unifiedJsonStr = JSON.stringify(accountObj);

    // 3. Commit isolated block directly into the new key sequence
    if (isElectron()) await settingsDB.set(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
    else localStorage.setItem(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
    
    // 4. Update overarching cache payload
    localStorage.setItem(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
    
    showSuccess(t('settings.passwordUpdated'));
    setPasswords({ current: '', newPass: '', confirm: '' });
  };

  const passwordsMatch = passwords.newPass === passwords.confirm;
  const canChangePassword = passwords.current && passwords.newPass && passwords.confirm && passwordsMatch;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Profile Card */}
      <Card
        sx={{
          p: 3,
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          {t('settings.profile')}
        </Typography>

        <TextField
          fullWidth
          label={t('settings.displayName')}
          value={profile.displayName}
          onChange={handleProfileChange('displayName')}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:diskette-bold-duotone" width={20} />}
            onClick={handleSaveProfile}
          >
            {t('settings.saveProfile')}
          </Button>
        </Box>
      </Card>

      {/* Change Password Card */}
      <Card
        sx={{
          p: 3,
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {t('settings.changePassword')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {t('settings.changePasswordDesc')}
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t('settings.currentPassword')}
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange('current')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('settings.newPassword')}
              type="password"
              value={passwords.newPass}
              onChange={handlePasswordChange('newPass')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t('settings.confirmNewPassword')}
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange('confirm')}
              error={passwords.confirm !== '' && !passwordsMatch}
              helperText={passwords.confirm !== '' && !passwordsMatch ? t('settings.passwordsDoNotMatch') : ''}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="warning"
            disabled={!canChangePassword}
            startIcon={<Iconify icon="solar:lock-bold-duotone" width={20} />}
            onClick={handleChangePassword}
          >
            {t('settings.updatePassword')}
          </Button>
        </Box>
      </Card>

      {/* Worker Access Card */}
      <Card
        sx={{
          p: 3,
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${isWorker ? theme.vars.palette.warning.main : theme.vars.palette.divider}`,
          borderRadius: 2,
          transition: 'border-color 0.2s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: isWorker ? 'warning.lighter' : 'action.selected',
                color: isWorker ? 'warning.dark' : 'text.secondary',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:user-id-bold-duotone" width={26} />
            </Box>
            <Box>
              <Typography variant="subtitle1">{t('settings.workerAccess')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('settings.workerAccessDesc')}
              </Typography>
            </Box>
          </Box>
          <Switch
            checked={isWorker}
            onChange={(e) => {
              setWorkerModeEnabled(e.target.checked);
              if (e.target.checked) setRole('worker');
            }}
            color="warning"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.suppliers')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.expenses')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.reports')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.settings')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.financials')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
          <Chip
            size="small"
            icon={<Iconify icon="solar:eye-closed-bold-duotone" width={14} />}
            label={t('settings.workerHide.prices')}
            color={isWorker ? 'warning' : 'default'}
            variant={isWorker ? 'filled' : 'outlined'}
          />
        </Stack>

        <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('settings.workerNote')}
          </Typography>
        </Box>
      </Card>

      {/* Reset Onboarding */}
      <Card
        sx={{
          p: 3,
          boxShadow: theme.vars.customShadows.z8,
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                bgcolor: 'action.selected',
                color: 'text.secondary',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:restart-bold-duotone" width={24} />
            </Box>
            <Box>
              <Typography variant="subtitle2">{t('settings.resetOnboarding') ?? 'Restart Onboarding'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('settings.resetOnboardingDesc') ?? 'Go through the initial setup wizard again'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Iconify icon="solar:restart-bold-duotone" width={16} />}
            onClick={() => setResetOnboardingOpen(true)}
          >
            {t('settings.resetOnboarding') ?? 'Restart'}
          </Button>
        </Box>
      </Card>

      {/* Reset Onboarding Confirm Dialog */}
      <Dialog open={resetOnboardingOpen} onClose={() => setResetOnboardingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.resetOnboarding') ?? 'Restart Onboarding'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'error.main', fontWeight: 600, mb: 1 }}>
            {t('settings.clearAllDataWarning')}
          </DialogContentText>
          <DialogContentText>
            {t('settings.clearAllDataDesc')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOnboardingOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (isElectron()) {
                // Wipe all data directly — awaited so SQLite is clear before reload
                await Promise.all([
                  productsDB.clearAll(),
                  clientsDB.clearAll(),
                  suppliersDB.clearAll(),
                  invoicesDB.clearAll(),
                  expensesDB.clearAll(),
                  tvaDB.clearAll(),
                ]);
                await settingsDB.set('onboarding_complete', 'false');
              }
              localStorage.clear();
              // Full reload — React restarts from empty SQLite, guard redirects to /onboarding
              window.location.reload();
            }}
          >
            {t('settings.clearAllData') ?? 'Wipe & Restart'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
