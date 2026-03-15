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

import { useTranslation, useI18n } from 'src/contexts';

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
  const { dir } = useI18n();
  const isRTL = dir === 'rtl';

  return (
    <Box
      sx={{
        pt: 2.5,
        paddingInlineStart: collapsed ? 1 : 2.5,
        paddingInlineEnd: 0,
        top: 0,
        insetInlineStart: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        bgcolor: '#0A1929',
        backgroundImage: 'linear-gradient(135deg, #163251 0%, #0A1929 100%)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset -2px 0 20px -4px rgba(0,0,0,0.4)',
        borderInlineEnd: 'none',
        transition: theme.transitions.create(['width', 'padding'], {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 25%)',
          pointerEvents: 'none',
        },
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} collapsed={collapsed} />
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
  const { dir } = useI18n();
  const isRTL = dir === 'rtl';

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
      anchor={isRTL ? 'right' : 'left'}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          paddingInlineStart: 2.5,
          paddingInlineEnd: 0,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          bgcolor: '#0A1929',
          backgroundImage: 'linear-gradient(135deg, #163251 0%, #0A1929 100%)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), inset -2px 0 20px -4px rgba(0,0,0,0.4)',
          borderInlineEnd: 'none',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 25%)',
            pointerEvents: 'none',
          },
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
  const { t } = useTranslation();
  const { dir } = useI18n();
  const isRtl = dir === 'rtl';

  return (
    <>
      <Box sx={{
        display: 'flex',
        justifyContent: (collapsed || isRtl) ? 'center' : 'flex-start',
        mt: 2,
        ...(!isRtl && collapsed && { ml: -1.5 }),
        // In RTL: compensate asymmetric sidebar padding (paddingInlineStart:2.5/1, paddingInlineEnd:0)
        // Use ml (not mr) because stylis-plugin-rtl flips ml→margin-right in RTL mode
        ...(isRtl && !collapsed && { ml: -2.5 }),
        ...(isRtl && collapsed && { ml: -1 }),
      }}>
        <Logo isSingle={collapsed} />
      </Box>

      {slots?.topArea}

      <Box sx={{ mt: 8 }} />

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
              gap: 2.5,
              display: 'flex',
              flexDirection: 'column',
              pb: 3,
            }}
          >
            {data.map((item) => {
              const isActived = item.path === pathname;
              const displayTitle = item.titleKey ? t(item.titleKey) : item.title;

              return (
                <ListItem disableGutters disablePadding key={item.path}>
                  <Tooltip title={collapsed ? displayTitle : ''} placement="right" arrow>
                    <ListItemButton
                      disableRipple
                      disableGutters
                      component={RouterLink}
                      href={item.path}
                      sx={[
                        (theme) => ({
                          paddingInlineStart: collapsed ? 0 : 2,
                          py: 1.25,
                          gap: collapsed ? 0 : 2,
                          paddingInlineEnd: collapsed ? 0 : 1.5,
                          borderRadius: 2.5,
                          typography: 'body2',
                          fontWeight: 'fontWeightMedium',
                          color: 'rgba(255,255,255,0.65)',
                          minHeight: 48,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          transition: 'background-color 0.18s, color 0.18s',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                          },
                          ...(isActived && {
                            fontWeight: 'fontWeightBold',
                            color: theme.vars.palette.primary.main,
                            bgcolor: theme.vars.palette.background.default,
                            borderRadius: '24px 0 0 24px',
                            paddingInlineEnd: 2.5,
                            overflow: 'visible',
                            position: 'relative',
                            zIndex: 2,
                            '&:hover': {
                              bgcolor: theme.vars.palette.background.default,
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: -24,
                              right: 0,
                              width: 24, 
                              height: 24,
                              backgroundImage: theme.direction === 'rtl'
                                ? `radial-gradient(circle at 100% 0%, transparent 23.5px, ${theme.vars.palette.background.default} 24px)`
                                : `radial-gradient(circle at 0% 0%, transparent 23.5px, ${theme.vars.palette.background.default} 24px)`,
                              pointerEvents: 'none',
                              zIndex: 2,
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: -24,
                              right: 0,
                              width: 24, 
                              height: 24,
                              backgroundImage: theme.direction === 'rtl'
                                ? `radial-gradient(circle at 100% 100%, transparent 23.5px, ${theme.vars.palette.background.default} 24px)`
                                : `radial-gradient(circle at 0% 100%, transparent 23.5px, ${theme.vars.palette.background.default} 24px)`,
                              pointerEvents: 'none',
                              zIndex: 2,
                            },
                          }),
                        }),
                      ]}
                    >
                      <Box component="span" sx={{ width: 24, height: 24, flexShrink: 0, color: isActived ? 'primary.main' : 'rgba(255,255,255,0.65)', zIndex: 2 }}>
                        {item.icon}
                      </Box>

                      {!collapsed && (
                        <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 2 }}>
                          {displayTitle}
                        </Box>
                      )}

                      {!collapsed && item.info && <Box sx={{ zIndex: 2 }}>{item.info}</Box>}
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
