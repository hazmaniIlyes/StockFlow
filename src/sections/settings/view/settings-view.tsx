import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useTranslation } from 'src/contexts';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { SettingsReset } from '../settings-reset';
import { SettingsInvoice } from '../settings-invoice';
import { SettingsAccount } from '../settings-account';
import { SettingsCategories } from '../settings-categories';
import { SettingsPreferences } from '../settings-preferences';
import { SettingsBusinessInfo } from '../settings-business-info';

// ======================================================================

const TABS = [
  { labelKey: 'settings.businessInfo', icon: 'solar:shop-bold-duotone' },
  { labelKey: 'settings.invoiceSettings', icon: 'solar:bill-list-bold-duotone' },
  { labelKey: 'settings.categories', icon: 'solar:tag-bold-duotone' },
  { labelKey: 'settings.account', icon: 'solar:user-bold-duotone' },
  { labelKey: 'settings.preferences', icon: 'solar:settings-minimalistic-bold-duotone' },
  { labelKey: 'settings.resetSection', icon: 'solar:restart-bold-duotone' },
];

export function SettingsView() {
  const [searchParams] = useSearchParams();
  const initialTab = Number(searchParams.get('tab') ?? 0);
  const [tab, setTab] = useState(initialTab);
  const { t } = useTranslation();

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {t('settings.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
        {/* Sub-sidebar — desktop */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            minWidth: 220,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            gap: 0.5,
            flexShrink: 0,
          }}
        >
          {TABS.map((tabItem, idx) => {
            const isActive = tab === idx;
            return (
              <ButtonBase
                key={tabItem.labelKey}
                onClick={() => setTab(idx)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.5,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  typography: 'body2',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive ? 'primary.lighter' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.lighter' : 'action.hover',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                  transition: 'all 0.15s',
                }}
              >
                <Iconify
                  icon={tabItem.icon}
                  width={20}
                  sx={{ flexShrink: 0, color: isActive ? 'primary.main' : 'text.disabled' }}
                />
                {t(tabItem.labelKey)}
              </ButtonBase>
            );
          })}
        </Box>

        {/* Horizontal tabs for mobile */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}
        >
          {TABS.map((tabItem) => (
            <Tab
              key={tabItem.labelKey}
              label={t(tabItem.labelKey)}
              icon={<Iconify icon={tabItem.icon} width={18} />}
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
          {tab === 5 && <SettingsReset />}
        </Box>
      </Box>
    </DashboardContent>
  );
}
