import type { IconProps } from '@iconify/react';

import { useId } from 'react';
import { Icon } from '@iconify/react';

import { styled } from '@mui/material/styles';


export type IconifyProps = React.ComponentProps<typeof IconRoot> &
  Omit<IconProps, 'icon'> & {
    icon: string;
  };

export function Iconify({ className, icon, width = 20, height, sx, ...other }: IconifyProps) {
  const id = useId();

  return (
    <IconRoot
      ssr
      id={id}
      icon={icon}
      className={className}
      sx={[
        {
          width,
          flexShrink: 0,
          height: height ?? width,
          display: 'inline-flex',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}


const IconRoot = styled(Icon)``;
