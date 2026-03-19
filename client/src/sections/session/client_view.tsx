import { useEffect, useState } from 'react';
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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';

import { Iconify } from 'src/components/iconify';
import type { Session } from 'src/types/sessions';
import { useSessionStore } from 'src/stores/session-store';

export function SessionView() {
    const {
        sessions,
        page,
        size,
        totalPages,
        totalElements,
        loading,
        error,
        fetch: fetchSessions,
        disconnect,
        setSize: storeSetSize,
        clearError,
    } = useSessionStore();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Session | null>(null);
    const [disconnecting, setDisconnecting] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchSessions(0, size, '');
    }, []);

    const handleDisconnect = async (clientId: string) => {
        if (!window.confirm(`Disconnect client "${clientId}"?`)) return;
        setDisconnecting(clientId);
        try {
            await disconnect(clientId);
            setSnackbar(`Client "${clientId}" disconnected`);
            if (selected?.client_id === clientId) setSelected(null);
        } catch {
            /** error handled by store */
        } finally {
            setDisconnecting(null);
        }
    };

    if (loading && sessions.length === 0) {
        return (
            <Box sx={{ m: 3, display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    const subscriptionEntries = selected ? Object.entries(selected.subscriptions) : [];

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
                        {t('sessions.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {totalElements} connected {totalElements === 1 ? 'client' : 'clients'}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        size="small"
                        placeholder={t('sessions.search') + '...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') fetchSessions(0, size, search);
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Iconify icon="mdi:magnify" width={18} sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            width: { xs: 'auto', sm: 220 },
                            flex: { xs: 1, sm: 'none' },
                            '& .MuiOutlinedInput-root': { height: 36 },
                        }}
                    />
                    <Button
                        variant="contained"
                        color="inherit"
                        startIcon={<Iconify icon="mdi:refresh" width={18} />}
                        onClick={() => fetchSessions(page, size, search)}
                        size="small"
                        sx={{ height: 36 }}
                    >
                        {t('sessions.refresh')}
                    </Button>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                    {error}
                </Alert>
            )}

            {!loading && sessions.length === 0 ? (
                <Alert severity="info">{t('sessions.empty')}</Alert>
            ) : (
                <Card>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 50 }}>{t('sessions.id')}</TableCell>
                                    <TableCell>{t('sessions.clientId')}</TableCell>
                                    <TableCell>{t('sessions.username')}</TableCell>
                                    <TableCell>{t('sessions.remoteAddress')}</TableCell>
                                    <TableCell>{t('sessions.port')}</TableCell>
                                    <TableCell>{t('sessions.connectedAt')}</TableCell>
                                    <TableCell>{t('sessions.subscriptions')}</TableCell>
                                    <TableCell align="right" sx={{ width: 100 }}>
                                        {t('sessions.actions')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sessions.map((session, index) => (
                                    <TableRow
                                        key={session.client_id}
                                        sx={{
                                            cursor: 'pointer',
                                            ...(selected?.client_id === session.client_id && {
                                                bgcolor: 'rgba(0, 167, 111, 0.06)',
                                            }),
                                        }}
                                        onClick={() => setSelected(session)}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {page * size + index + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ fontFamily: 'JetBrains Mono Variable', fontSize: '0.8rem' }}
                                            >
                                                {session.client_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {session.username || (
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    --
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontFamily: 'JetBrains Mono Variable', fontSize: '0.8rem' }}
                                            >
                                                {session.remote_addr}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={session.connected_port}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontFamily: 'JetBrains Mono Variable',
                                                    fontSize: '0.75rem',
                                                    borderColor: 'rgba(148,163,184,0.15)',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {session.connected_at}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={Object.keys(session.subscriptions).length}
                                                size="small"
                                                color={
                                                    Object.keys(session.subscriptions).length > 0
                                                        ? 'primary'
                                                        : 'default'
                                                }
                                                variant="filled"
                                                sx={{ minWidth: 28, fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                            <Tooltip title="View details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setSelected(session)}
                                                    sx={{
                                                        color: 'text.secondary',
                                                        '&:hover': { color: 'primary.main' },
                                                    }}
                                                >
                                                    <Iconify icon="mdi:eye-outline" width={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Disconnect">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDisconnect(session.client_id)}
                                                    disabled={disconnecting === session.client_id}
                                                    sx={{ '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.1)' } }}
                                                >
                                                    {disconnecting === session.client_id ? (
                                                        <CircularProgress size={16} color="error" />
                                                    ) : (
                                                        <Iconify icon="mdi:connection" width={18} />
                                                    )}
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

            {sessions.length > 0 && (
                <Box mt={2.5} display="flex" justifyContent="center" alignItems="center" gap={2}>
                    <Pagination
                        count={totalPages}
                        page={page + 1}
                        onChange={(_, value) => fetchSessions(value - 1, size, search)}
                        color="primary"
                        size="small"
                    />
                    <FormControl size="small">
                        <Select
                            value={size}
                            onChange={(e) => {
                                const newSize = Number(e.target.value);
                                storeSetSize(newSize);
                                fetchSessions(0, newSize, search);
                            }}
                            sx={{ fontSize: '0.8rem' }}
                        >
                            <MenuItem value={5}>5 / page</MenuItem>
                            <MenuItem value={10}>10 / page</MenuItem>
                            <MenuItem value={20}>20 / page</MenuItem>
                            <MenuItem value={50}>50 / page</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Session Detail Drawer */}
            <Drawer
                anchor="right"
                open={!!selected}
                onClose={() => setSelected(null)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: { xs: '100%', sm: 400 },
                        bgcolor: '#131825',
                        borderLeft: '1px solid rgba(148,163,184,0.12)',
                        boxShadow: 'none',
                    },
                }}
            >
                {selected && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header */}
                        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Session Details
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setSelected(null)}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    <Iconify icon="mdi:close" width={20} />
                                </IconButton>
                            </Stack>
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                            {/* Connection Info */}
                            <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1.5, display: 'block' }}>
                                Connection
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 3 }}>
                                <DetailRow label="Client ID" value={selected.client_id} mono />
                                <DetailRow label="Username" value={selected.username || '--'} />
                                <DetailRow label="Remote Address" value={selected.remote_addr} mono />
                                <DetailRow label="Connected Port" value={String(selected.connected_port)} mono />
                                <DetailRow label="Connected At" value={selected.connected_at} />
                                <DetailRow
                                    label="Clean Session"
                                    value={
                                        <Chip
                                            label={selected.clean_session ? 'Yes' : 'No'}
                                            size="small"
                                            color={selected.clean_session ? 'primary' : 'default'}
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: 22 }}
                                        />
                                    }
                                />
                            </Stack>

                            <Divider sx={{ borderColor: 'rgba(148,163,184,0.1)', mb: 2 }} />

                            {/* Subscriptions */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                                    Subscriptions ({subscriptionEntries.length})
                                </Typography>
                            </Stack>

                            {subscriptionEntries.length === 0 ? (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 1.5,
                                        bgcolor: 'rgba(148,163,184,0.04)',
                                        border: '1px solid rgba(148,163,184,0.08)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No active subscriptions
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={0.75}>
                                    {subscriptionEntries.map(([topic, sub]) => (
                                        <Box
                                            key={topic}
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderRadius: 1.5,
                                                bgcolor: '#1A2035',
                                                border: '1px solid rgba(148,163,184,0.08)',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontFamily: 'JetBrains Mono Variable',
                                                    fontSize: '0.8rem',
                                                    color: 'primary.light',
                                                    wordBreak: 'break-all',
                                                }}
                                            >
                                                {topic}
                                            </Typography>
                                            {sub?.qos !== undefined && (
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    QoS {sub.qos}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ p: 3, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="error"
                                startIcon={<Iconify icon="mdi:connection" width={18} />}
                                onClick={() => handleDisconnect(selected.client_id)}
                                disabled={disconnecting === selected.client_id}
                                sx={{ py: 1.2 }}
                            >
                                {disconnecting === selected.client_id ? 'Disconnecting...' : 'Disconnect Client'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* Success snackbar */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
                    {snackbar}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                {label}
            </Typography>
            {typeof value === 'string' ? (
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        ...(mono && { fontFamily: 'JetBrains Mono Variable', fontSize: '0.78rem' }),
                        maxWidth: 200,
                        textAlign: 'right',
                        wordBreak: 'break-all',
                    }}
                >
                    {value}
                </Typography>
            ) : (
                value
            )}
        </Box>
    );
}
