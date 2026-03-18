import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="CoreMQ"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`,
          color: theme.vars.palette.primary.contrastText,
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: '-0.02em',
          boxShadow: `0 4px 12px 0 rgba(0, 167, 111, 0.25)`,
        }}
      >
        C
      </Box>
      {!isSingle && (
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: theme.vars.palette.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          CoreMQ
        </Typography>
      )}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
