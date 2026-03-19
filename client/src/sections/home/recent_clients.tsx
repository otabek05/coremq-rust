import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';

import { Iconify } from 'src/components/iconify';
import type { Session } from 'src/types/sessions';

type Props = {
    sessions: Session[] | null;
};

export default function RecentClients({ sessions }: Props) {
    return (
        <Card sx={{ p: 0, height: '100%' }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Recent Connections
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Latest connected MQTT clients
                </Typography>
            </Box>

            <Box sx={{ px: 2.5, pb: 2.5 }}>
                {sessions === null ? (
                    <Stack spacing={1.5}>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={48} />
                        ))}
                    </Stack>
                ) : sessions.length === 0 ? (
                    <Box
                        sx={{
                            py: 4,
                            textAlign: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'rgba(148,163,184,0.04)',
                            border: '1px solid rgba(148,163,184,0.08)',
                        }}
                    >
                        <Iconify icon="lucide:users" width={28} sx={{ color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No active connections
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        {sessions.map((s) => (
                            <Box
                                key={s.client_id}
                                sx={{
                                    px: 2,
                                    py: 1.25,
                                    borderRadius: 1.5,
                                    bgcolor: 'rgba(148,163,184,0.04)',
                                    border: '1px solid rgba(148,163,184,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,167,111,0.08)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Iconify icon="lucide:monitor-dot" width={18} sx={{ color: '#00A76F' }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            fontFamily: 'JetBrains Mono Variable',
                                            fontSize: '0.78rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {s.client_id}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                        {s.username || 'anonymous'} &middot; {s.remote_addr}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={s.connected_port}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontFamily: 'JetBrains Mono Variable',
                                        fontSize: '0.7rem',
                                        height: 22,
                                        borderColor: 'rgba(148,163,184,0.15)',
                                        flexShrink: 0,
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </Card>
    );
}
