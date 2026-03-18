import type { Breakpoint } from '@mui/material/styles';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Icon } from '@iconify/react';

import { usePathname } from 'src/routes/hooks';
import { Scrollbar } from 'src/components/scrollbar';

import { NavItemRow } from './nav-item';
import { NavFooter } from './nav-footer';
import {
  NAV_WIDTH,
  NAV_COLLAPSED_WIDTH,
  NAV_TRANSITION,
  NAV_BG,
  NAV_BORDER,
} from './nav-config';
import type { NavContentProps } from './nav-config';

// Desktop sidebar
export function NavDesktop({
  sx,
  data,
  slots,
  collapsed,
  onToggle,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        height: '100vh',
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: NAV_BG,
        zIndex: 'var(--layout-nav-zIndex)',
        width: collapsed ? NAV_COLLAPSED_WIDTH : NAV_WIDTH,
        borderRight: NAV_BORDER,
        transition: NAV_TRANSITION,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      {/* Floating toggle — outside on the right edge, aligned with header center */}
      {onToggle && (
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            position: 'absolute',
            top: collapsed ? 16 : 20,
            right: -16,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#1E293B',
            border: '1px solid rgba(148,163,184,0.15)',
            color: '#94A3B8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            '&:hover': {
              bgcolor: '#334155',
              color: '#E2E8F0',
            },
          }}
        >
          <Icon
            icon={collapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'}
            width={14}
          />
        </IconButton>
      )}

      <Box sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <NavContent data={data} slots={slots} collapsed={collapsed} />
      </Box>
    </Box>
  );
}

// Mobile drawer
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
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          overflow: 'unset',
          bgcolor: NAV_BG,
          width: NAV_WIDTH,
          boxShadow: 'none',
          borderRight: NAV_BORDER,
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} collapsed={false} />
    </Drawer>
  );
}

// Main content
function NavContent({ data, slots, sx, collapsed }: Omit<NavContentProps, 'onToggle'>) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header — CoreMQ branding */}
      <Box sx={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
        <NavFooter collapsed={collapsed} />
      </Box>

      {slots?.topArea}

      {/* Nav groups */}
      <Scrollbar fillContent>
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
              px: collapsed ? 0 : 1.5,
              alignItems: collapsed ? 'center' : 'stretch',
              pt: 1,
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {data.map((group, groupIndex) => (
            <Box key={group.label} sx={{ mb: 1, width: collapsed ? 'auto' : '100%' }}>
              {groupIndex > 0 && !collapsed && (
                <Typography
                  sx={{
                    px: 1.5,
                    pt: 1.5,
                    pb: 0.75,
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#475569',
                  }}
                >
                  {group.label}
                </Typography>
              )}

              {groupIndex > 0 && collapsed && (
                <Box sx={{ height: '1px', bgcolor: 'rgba(148,163,184,0.08)', width: 28, my: 1, mx: 'auto' }} />
              )}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  alignItems: collapsed ? 'center' : 'stretch',
                }}
              >
                {group.items.map((item) => (
                  <NavItemRow
                    key={item.path}
                    item={item}
                    isActive={item.path === pathname}
                    collapsed={collapsed}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Scrollbar>
    </Box>
  );
}
