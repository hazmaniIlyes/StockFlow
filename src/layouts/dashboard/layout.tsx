import type { Breakpoint } from '@mui/material/styles';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

import { _langs } from 'src/_mock';

import { useSettings, useI18n } from 'src/contexts';
import { Iconify } from 'src/components/iconify';

import { NavMobile, NavDesktop } from './nav';
import { layoutClasses } from '../core/classes';
import { _account } from '../nav-config-account';
import { dashboardLayoutVars } from './css-vars';
import { navData } from '../nav-config-dashboard';
import { MainSection } from '../core/main-section';
import { Searchbar } from '../components/searchbar';

import { MenuButton } from '../components/menu-button';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { AccountPopover } from '../components/account-popover';
import { LanguagePopover } from '../components/language-popover';
import { NotificationsPopover } from '../components/notifications-popover';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();
  const { preferences, role } = useSettings();
  const { dir } = useI18n();
  const isRTL = dir === 'rtl';

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();
  const { value: navCollapsed, onToggle: onToggleCollapse } = useBoolean();

  // Filter nav items based on settings and role
  const filteredNavData = useMemo(() => {
    let items = navData;
    if (!preferences.showExpenses) {
      items = items.filter((item) => item.path !== '/expenses');
    }
    if (role === 'worker') {
      const workerHiddenPaths = ['/suppliers', '/expenses', '/reports', '/settings'];
      items = items.filter((item) => !workerHiddenPaths.includes(item.path));
    }
    return items;
  }, [preferences.showExpenses, role]);

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ marginInlineEnd: 1, marginInlineStart: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile data={filteredNavData} open={open} onClose={onClose} />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          {/** @slot Searchbar */}
          <Searchbar />

          {/** @slot Language popover */}
          <LanguagePopover data={_langs} />

          {/** @slot Notifications popover */}
          <NotificationsPopover />

          {/** @slot Account drawer */}
          <AccountPopover data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  const collapsedWidth = 72;
  const expandedWidth = 240;
  const navWidth = navCollapsed ? collapsedWidth : expandedWidth;

  return (
    <>
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={
        <NavDesktop
          data={filteredNavData}
          layoutQuery={layoutQuery}
          collapsed={navCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      }
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme, navCollapsed), ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              paddingInlineStart: 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-inline-start'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>

    {/* Sidebar collapse toggle — just outside the sidebar, at the top */}
    <IconButton
      onClick={onToggleCollapse}
      sx={{
        display: { xs: 'none', [layoutQuery]: 'inline-flex' },
        position: 'fixed',
        top: 10,
        insetInlineStart: navWidth + 6,
        zIndex: 'var(--layout-nav-zIndex)',
        width: 32,
        height: 32,
        color: 'text.secondary',
        bgcolor: 'transparent',
        transition: theme.transitions.create('inset-inline-start', {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
      }}
    >
      <Iconify
        icon="mingcute:layout-left-line"
        width={20}
        sx={{
          transform: isRTL
            ? (navCollapsed ? 'scaleX(1)' : 'scaleX(-1)')
            : (navCollapsed ? 'scaleX(-1)' : 'scaleX(1)'),
          transition: 'transform 200ms ease-in-out',
        }}
      />
    </IconButton>
    </>
  );
}
