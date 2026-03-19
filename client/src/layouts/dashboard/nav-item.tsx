import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { RouterLink } from 'src/routes/components';

import type { NavItem } from '../nav-config-dashboard';

type NavItemRowProps = {
    item: NavItem;
    isActive: boolean;
    collapsed?: boolean;
};

export function NavItemRow({ item, isActive, collapsed }: NavItemRowProps) {
    if (collapsed) {
        return (
            <Tooltip title={item.title} placement="right" arrow>
                <Box
                    component={RouterLink}
                    href={item.path}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        textDecoration: 'none',
                        color: isActive ? '#5BE49B' : '#64748B',
                        bgcolor: isActive ? 'rgba(148,163,184,0.1)' : 'transparent',
                        transition: 'all 0.12s ease',
                        '&:hover': {
                            color: isActive ? '#5BE49B' : '#94A3B8',
                            bgcolor: isActive ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.06)',
                        },
                    }}
                >
                    <Box
                        component="span"
                        sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {item.icon}
                    </Box>
                </Box>
            </Tooltip>
        );
    }

    return (
        <Box
            component={RouterLink}
            href={item.path}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.875,
                borderRadius: 1.5,
                textDecoration: 'none',
                fontSize: '0.835rem',
                fontWeight: isActive ? 600 : 450,
                color: isActive ? '#F1F5F9' : '#94A3B8',
                bgcolor: isActive ? 'rgba(148,163,184,0.1)' : 'transparent',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                '&:hover': {
                    color: '#F1F5F9',
                    bgcolor: isActive ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.06)',
                },
            }}
        >
            <Box
                component="span"
                sx={{
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#5BE49B' : 'inherit',
                    flexShrink: 0,
                }}
            >
                {item.icon}
            </Box>
            <Box component="span" sx={{ flexGrow: 1 }}>
                {item.title}
            </Box>
            {item.info && item.info}
        </Box>
    );
}
