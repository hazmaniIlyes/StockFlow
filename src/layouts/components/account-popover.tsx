import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useRouter, usePathname } from 'src/routes/hooks';

import { useSettings } from 'src/contexts/settings-context';
import { useTranslation } from 'src/contexts';
import { getAdminPassword } from 'src/sections/settings/settings-account';

import { Iconify } from 'src/components/iconify';
import { settingsDB, isElectron } from 'src/services/db'; // Import SQLite DB wrapper

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    titleKey?: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();

  const pathname = usePathname();

  const { t } = useTranslation();

  const { role, setRole, workerModeEnabled } = useSettings();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('account'); // New unified JSON property priority
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc.displayName) return { displayName: acc.displayName, photoURL: acc.photoURL };
      }
    } catch { /* ignore */ }
    return { displayName: 'Admin', photoURL: undefined };
  });

  // Pull authentic SQLite values on mount to overwrite any stale cache seamlessly
  useEffect(() => {
    async function loadDBProfile() {
      if (isElectron()) {
        try {
          const stored = await settingsDB.get('account');
          if (stored) {
            const acc = JSON.parse(stored);
            if (acc.displayName) setAdminProfile({ displayName: acc.displayName, photoURL: acc.photoURL });
          }
        } catch (e) {
          console.error('Failed to load profile from DB:', e);
        }
      }
    }
    loadDBProfile(); // Trigger SQLite hydration
  }, []);

  // Poll exactly every 1000ms carefully checking the unified object
  useEffect(() => {
    const checkProfileCache = () => {
      let dName: string | undefined;
      let pUrl: string | undefined;

      const accStr = localStorage.getItem('account');
      if (accStr) {
        const acc = JSON.parse(accStr);
        dName = acc.displayName;
        pUrl = acc.photoURL;
      }

      if (dName) {
        setAdminProfile((prev) => 
          prev.displayName !== dName || prev.photoURL !== pUrl 
            ? { displayName: dName, photoURL: pUrl } : prev
        );
      }
    };
    const intervalId = setInterval(checkProfileCache, 1000); // Polling sync
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  const handleToggleRole = useCallback(
    (_e: React.MouseEvent, val: string | null) => {
      if (!val) return;
      if (val === 'admin' && role === 'worker') {
        // Require password to switch back to Admin
        setPasswordInput('');
        setPasswordError(false);
        setPasswordDialog(true);
      } else {
        setRole(val as 'admin' | 'worker');
      }
    },
    [role, setRole]
  );

  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === getAdminPassword()) {
      setRole('admin');
      setPasswordDialog(false);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }, [passwordInput, setRole]);

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.vars.palette.primary.light}, ${theme.vars.palette.warning.light}, ${theme.vars.palette.primary.light})`,
          ...sx,
        }}
        {...other}
      >
        <Avatar src={adminProfile.photoURL} alt={adminProfile.displayName} sx={{ width: 1, height: 1 }}>
          {adminProfile.displayName.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 230 },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {adminProfile.displayName}
              </Typography>
            </Box>

            {workerModeEnabled && (
              <Chip
                label={role === 'admin' ? 'Admin' : 'Worker'}
                size="small"
                color={role === 'admin' ? 'primary' : 'default'}
                sx={{ ml: 1, flexShrink: 0, fontWeight: 600, fontSize: 11 }}
              />
            )}
          </Box>

          {workerModeEnabled && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={role}
            onChange={handleToggleRole}
            sx={{
              mt: 1.5,
              width: '100%',
              '& .MuiToggleButton-root': {
                flex: 1,
                py: 0.5,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid',
                borderColor: 'divider',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
            <ToggleButton value="admin">Admin</ToggleButton>
            <ToggleButton value="worker">Worker</ToggleButton>
          </ToggleButtonGroup>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList
          disablePadding
          sx={{
            p: 1,
            gap: 0.5,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              [`&.${menuItemClasses.selected}`]: {
                color: 'text.primary',
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {data.map((option) => {
            const displayLabel = option.titleKey ? t(option.titleKey) : option.label;
            return (
              <MenuItem
                key={option.label}
                selected={option.href === pathname}
                onClick={() => handleClickItem(option.href)}
              >
                {option.icon}
                {displayLabel}
              </MenuItem>
            );
          })}
        </MenuList>
      </Popover>

      {/* Admin password dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        slotProps={{ paper: { sx: { width: 360 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Iconify icon="solar:lock-bold-duotone" width={24} sx={{ color: 'warning.main' }} />
          {t('settings.adminPasswordRequired')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('settings.enterAdminPassword')}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            size="small"
            label={t('settings.adminPassword')}
            type={showPassword ? 'text' : 'password'}
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
            error={passwordError}
            helperText={passwordError ? t('settings.wrongCurrentPassword') : ''}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                      <Iconify icon={showPassword ? 'solar:eye-closed-bold' : 'solar:eye-bold'} width={18} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog(false)} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:lock-unlocked-bold-duotone" width={18} />}
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
