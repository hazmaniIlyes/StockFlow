import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { SettingsBusinessInfo } from '../settings-business-info';
import { SettingsInvoice } from '../settings-invoice';
import { SettingsCategories } from '../settings-categories';
import { SettingsAccount } from '../settings-account';
import { SettingsPreferences } from '../settings-preferences';

// ======================================================================

const TABS = [
  { label: 'Business Info', icon: 'solar:shop-bold-duotone' },
  { label: 'Invoice', icon: 'solar:bill-list-bold-duotone' },
  { label: 'Categories', icon: 'solar:tag-bold-duotone' },
  { label: 'Account', icon: 'solar:user-bold-duotone' },
  { label: 'Preferences', icon: 'solar:settings-minimalistic-bold-duotone' },
];

export function SettingsView() {
  const [tab, setTab] = useState(0);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Settings
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Tabs (vertical on desktop, horizontal on mobile) */}
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minWidth: 200,
            borderRight: 1,
            borderColor: 'divider',
            display: { xs: 'none', md: 'flex' },
            '& .MuiTab-root': {
              alignItems: 'flex-start',
              textAlign: 'left',
              minHeight: 48,
              px: 2,
            },
          }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.label}
              label={t.label}
              icon={<Iconify icon={t.icon} width={20} />}
              iconPosition="start"
              sx={{ justifyContent: 'flex-start', gap: 1.5 }}
            />
          ))}
        </Tabs>

        {/* Horizontal tabs for mobile */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.label}
              label={t.label}
              icon={<Iconify icon={t.icon} width={18} />}
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          ))}
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {tab === 0 && <SettingsBusinessInfo />}
          {tab === 1 && <SettingsInvoice />}
          {tab === 2 && <SettingsCategories />}
          {tab === 3 && <SettingsAccount />}
          {tab === 4 && <SettingsPreferences />}
        </Box>
      </Box>
    </DashboardContent>
  );
}
