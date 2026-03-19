import type { Theme, SxProps } from '@mui/material/styles';
import type { NavGroup } from '../nav-config-dashboard';

export const NAV_WIDTH = 260;
export const NAV_COLLAPSED_WIDTH = 72;
export const NAV_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
export const NAV_BG = '#0E1320';
export const NAV_BORDER = '1px solid rgba(148,163,184,0.08)';

export type NavContentProps = {
    data: NavGroup[];
    collapsed?: boolean;
    onToggle?: () => void;
    slots?: {
        topArea?: React.ReactNode;
        bottomArea?: React.ReactNode;
    };
    sx?: SxProps<Theme>;
};
