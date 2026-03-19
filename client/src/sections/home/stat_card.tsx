import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';

import { Iconify } from 'src/components/iconify';

type Props = {
    label: string;
    value: number | null;
    icon: string;
    color: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    footer: string;
    subtitle: string;
};

export default function StatCard({ label, value, icon, color, trend, trendValue, footer, subtitle }: Props) {
    const trendColor = trend === 'up' ? '#00A76F' : trend === 'down' ? '#FF5630' : '#919EAB';
    const trendIcon =
        trend === 'up' ? 'lucide:trending-up' : trend === 'down' ? 'lucide:trending-down' : 'lucide:minus';

    return (
        <Card sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 0.5 }}>
                            {label}
                        </Typography>
                        {value === null ? (
                            <Skeleton variant="text" width={80} height={40} />
                        ) : (
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                {value.toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        icon={<Iconify icon={trendIcon} width={14} />}
                        label={trendValue}
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 26,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderColor: `${trendColor}33`,
                            color: trendColor,
                            '& .MuiChip-icon': { color: trendColor, ml: 0.5 },
                        }}
                    />
                </Stack>
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 2.5,
                    mt: 'auto',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                    <Iconify icon={icon} width={16} sx={{ color }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        {footer}
                    </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                    {subtitle}
                </Typography>
            </Box>
        </Card>
    );
}
