import type { Theme } from '@mui/material/styles';


export function dashboardLayoutVars(theme: Theme) {
  return {
    '--layout-transition-easing': 'cubic-bezier(0.4, 0, 0.2, 1)',
    '--layout-transition-duration': '200ms',
    '--layout-nav-vertical-width': '260px',
    '--layout-dashboard-content-pt': theme.spacing(3),
    '--layout-dashboard-content-pb': theme.spacing(8),
    '--layout-dashboard-content-px': theme.spacing(4),
  };
}
