import type { IconButtonProps } from '@mui/material/IconButton';

import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

export function MenuButton({ sx, ...other }: IconButtonProps) {
    return (
        <IconButton sx={sx} {...other}>
            <Iconify icon="lucide:menu" width={22} />
        </IconButton>
    );
}
