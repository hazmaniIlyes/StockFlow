import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ======================================================================

export function SettingsAccount() {
  const theme = useTheme();

  const [profile, setProfile] = useState({
    displayName: 'Jaydon Frankie',
    email: 'demo@minimals.cc',
    language: 'en',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const handleProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
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
          Profile
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Display Name"
              value={profile.displayName}
              onChange={handleProfileChange('displayName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange('email')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Language"
              select
              value={profile.language}
              onChange={handleProfileChange('language')}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="ar">العربية</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="contained" startIcon={<Iconify icon="solar:diskette-bold-duotone" width={20} />}>
            Save Profile
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
        <Typography variant="h6" sx={{ mb: 3 }}>
          Change Password
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={handlePasswordChange('current')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwords.newPass}
              onChange={handlePasswordChange('newPass')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwords.confirm}
              onChange={handlePasswordChange('confirm')}
              error={passwords.confirm !== '' && !passwordsMatch}
              helperText={passwords.confirm !== '' && !passwordsMatch ? 'Passwords do not match' : ''}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="warning"
            disabled={!canChangePassword}
            startIcon={<Iconify icon="solar:lock-bold-duotone" width={20} />}
          >
            Update Password
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
