import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

type NavFooterProps = {
    collapsed?: boolean;
};

const mqBadgeSx = {
    borderRadius: 1.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #00A76F, #007867)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 800,
    flexShrink: 0,
};

export function NavFooter({ collapsed }: NavFooterProps) {
    if (collapsed) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                <Tooltip title="CoreMQ" placement="right">
                    <Box sx={{ ...mqBadgeSx, width: 32, height: 32 }}>MQ</Box>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 2, py: 1.5 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.25,
                    py: 1,
                }}
            >
                <Box sx={{ ...mqBadgeSx, width: 30, height: 30 }}>MQ</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0', lineHeight: 1.2 }}>
                        CoreMQ
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.2 }}>MQTT Broker</Typography>
                </Box>
            </Box>
        </Box>
    );
}
