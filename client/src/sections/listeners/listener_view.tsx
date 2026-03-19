import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { useListenerStore } from 'src/stores/listener-store';

export function ListenerView() {
    const { listeners, loading, error, fetch: fetchListeners, stop, clearError } = useListenerStore();
    const { t } = useTranslation();

    useEffect(() => {
        fetchListeners();
    }, []);

    const handleStop = async (port: number, name: string) => {
        if (!window.confirm(`Stop listener "${name}" on port ${port}?`)) return;
        await stop(port);
    };

    const protocolColor = (protocol: string) => {
        switch (protocol.toLowerCase()) {
            case 'tcp':
                return 'primary';
            case 'tls':
                return 'success';
            case 'ws':
                return 'warning';
            case 'wss':
                return 'info';
            default:
                return 'default';
        }
    };

    if (loading && listeners.length === 0) {
        return (
            <Box sx={{ m: 3, display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: { xs: 2, sm: 0 },
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: { xs: '1.4rem', sm: '2.125rem' } }}
                    >
                        {t('listeners.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {listeners.length} active {listeners.length === 1 ? 'listener' : 'listeners'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="mdi:refresh" width={18} />}
                    onClick={fetchListeners}
                    size="small"
                >
                    {t('sessions.refresh')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                    {error}
                </Alert>
            )}

            {listeners.length === 0 ? (
                <Alert severity="info">{t('listeners.empty')}</Alert>
            ) : (
                <Card>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 50 }}>#</TableCell>
                                    <TableCell>{t('listeners.name')}</TableCell>
                                    <TableCell>{t('listeners.protocol')}</TableCell>
                                    <TableCell>{t('listeners.host')}</TableCell>
                                    <TableCell>{t('listeners.port')}</TableCell>
                                    <TableCell>{t('listeners.tls')}</TableCell>
                                    <TableCell align="right" sx={{ width: 80 }}>
                                        {t('sessions.actions')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {listeners.map((listener, index) => (
                                    <TableRow key={`${listener.name}-${listener.port}`}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {index + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="subtitle2">{listener.name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={listener.protocol.toUpperCase()}
                                                color={protocolColor(listener.protocol) as any}
                                                size="small"
                                                variant="filled"
                                                sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontFamily: 'JetBrains Mono Variable', fontSize: '0.8rem' }}
                                            >
                                                {listener.host}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontFamily: 'JetBrains Mono Variable', fontSize: '0.8rem' }}
                                            >
                                                {listener.port}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {listener.tls ? (
                                                <Chip
                                                    label="Enabled"
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem' }}
                                                />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    --
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Stop listener">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleStop(listener.port, listener.name)}
                                                    sx={{ '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.1)' } }}
                                                >
                                                    <Iconify icon="mdi:stop-circle-outline" width={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}
        </Box>
    );
}
