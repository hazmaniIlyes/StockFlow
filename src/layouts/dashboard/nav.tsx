import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import type { NavItem } from '../nav-config-dashboard';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  collapsed?: boolean;
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  collapsed = false,
  onToggleCollapse,
  layoutQuery,
}: NavContentProps & {
  layoutQuery: Breakpoint;
  onToggleCollapse?: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: collapsed ? 1 : 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        bgcolor: '#0A1929',
        borderRight: 'none',
        transition: theme.transitions.create(['width', 'padding'], {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} collapsed={collapsed} />

      {/* Toggle button */}
      <IconButton
        onClick={onToggleCollapse}
        sx={{
          position: 'absolute',
          top: 32,
          right: -14,
          zIndex: 9,
          width: 28,
          height: 28,
          bgcolor: '#0A1929',
          border: '1px solid rgba(255,255,255,0.16)',
          color: '#fff',
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.24)',
          '&:hover': { bgcolor: '#132F4C' },
        }}
      >
        <Iconify
          icon={collapsed ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'}
          width={16}
        />
      </IconButton>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, sx, collapsed = false }: NavContentProps) {
  const pathname = usePathname();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <Logo isSingle={collapsed} />
      </Box>

      {slots?.topArea}

      <Box sx={{ mt: 3 }} />

      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 1.5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {data.map((item) => {
              const isActived = item.path === pathname;

              return (
                <ListItem disableGutters disablePadding key={item.title}>
                  <Tooltip title={collapsed ? item.title : ''} placement="right" arrow>
                    <ListItemButton
                      disableGutters
                      component={RouterLink}
                      href={item.path}
                      sx={[
                        (theme) => ({
                          pl: collapsed ? 0 : 2,
                          py: 1,
                          gap: collapsed ? 0 : 2,
                          pr: collapsed ? 0 : 1.5,
                          borderRadius: 0.75,
                          typography: 'body2',
                          fontWeight: 'fontWeightMedium',
                          color: 'rgba(255,255,255,0.7)',
                          minHeight: 44,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                          ...(isActived && {
                            fontWeight: 'fontWeightSemiBold',
                            color: '#fff',
                            bgcolor: 'rgba(255,255,255,0.12)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.18)',
                            },
                          }),
                        }),
                      ]}
                    >
                      <Box component="span" sx={{ width: 24, height: 24, flexShrink: 0, color: isActived ? '#60A5FA' : '#fff' }}>
                        {item.icon}
                      </Box>

                      {!collapsed && (
                        <Box component="span" sx={{ flexGrow: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </Box>
                      )}

                      {!collapsed && item.info && item.info}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
    </>
  );
}
