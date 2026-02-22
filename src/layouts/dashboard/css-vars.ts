import type { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme, navCollapsed = false) {
  return {
    '--layout-transition-easing': 'ease-in-out',
    '--layout-transition-duration': '200ms',
    '--layout-nav-vertical-width': navCollapsed ? '72px' : '300px',
    '--layout-nav-collapsed-width': '72px',
    '--layout-dashboard-content-pt': theme.spacing(1),
    '--layout-dashboard-content-pb': theme.spacing(8),
    '--layout-dashboard-content-px': theme.spacing(5),
  };
}
