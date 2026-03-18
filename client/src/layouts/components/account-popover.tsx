import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Cookies from 'js-cookie';
import { Icon } from '@iconify/react';

import { useRouter } from 'src/routes/hooks';


export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleLogout = () => {
    Cookies.remove('access_token');
    handleClosePopover();
    router.push('/sign-in');
  };

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: 'rgba(148,163,184,0.08)',
          color: '#94A3B8',
          border: '1px solid rgba(148,163,184,0.1)',
          '&:hover': { bgcolor: 'rgba(148,163,184,0.14)', color: '#E2E8F0' },
          ...sx,
        }}
        {...other}
      >
        <Icon icon="lucide:user" width={18} />
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 200, mt: 1 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Admin
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            admin@coremq
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(148,163,184,0.1)' }} />

        <Box sx={{ p: 1 }}>
          <Button
            onClick={handleLogout}
            fullWidth
            size="small"
            sx={{
              justifyContent: 'flex-start',
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              color: '#FF5630',
              fontSize: '0.835rem',
              fontWeight: 500,
              '&:hover': { bgcolor: 'rgba(255,86,48,0.08)' },
            }}
            startIcon={<Icon icon="lucide:log-out" width={16} />}
          >
            {t('logout')}
          </Button>
        </Box>
      </Popover>
    </>
  );
}
