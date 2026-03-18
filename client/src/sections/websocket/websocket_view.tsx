import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { useTranslation } from 'react-i18next';

export type QoS = 0 | 1 | 2;
type LogItem = { time: string; topic: string; payload: string; qos: QoS };

const cardSx = {
  bgcolor: '#1E293B',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 3,
  p: 2.5,
};

const consoleSx = {
  borderRadius: 2,
  p: 1.5,
  overflowY: 'auto' as const,
  bgcolor: '#0F172A',
  border: '1px solid rgba(148,163,184,0.1)',
  fontFamily: 'JetBrains Mono Variable',
  fontSize: '0.78rem',
};

export function WebsocketView() {
  const { t } = useTranslation();

  const [url, setUrl] = useState('localhost');
  const [port, setPort] = useState('8083');
  const [path, setPath] = useState('/mqtt');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState(`mqttjs_${Math.random().toString(16).substr(2, 8)}`);
  const [protocol, setProtocol] = useState<'ws' | 'wss'>('ws');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const clientRef = useRef<MqttClient | null>(null);
  const fullUrl = `${protocol}://${url}:${port}${path.startsWith('/') ? path : `/${path}`}`;

  const [subTopics, setSubTopics] = useState<{ topic: string; qos: QoS }[]>([]);
  const [newSubTopic, setNewSubTopic] = useState('');
  const [newSubQoS, setNewSubQoS] = useState<QoS>(0);

  const [pubTopic, setPubTopic] = useState('test/topic');
  const [pubMsg, setPubMsg] = useState('');
  const [pubQoS, setPubQoS] = useState<QoS>(0);

  const [subLogs, setSubLogs] = useState<LogItem[]>([]);
  const [pubLogs, setPubLogs] = useState<LogItem[]>([]);

  const subConsoleRef = useRef<HTMLDivElement>(null);
  const pubConsoleRef = useRef<HTMLDivElement>(null);

  const handleConnect = () => {
    if (clientRef.current && clientRef.current.connected) return;
    setConnecting(true);
    const options: IClientOptions = {
      clientId,
      username: username || undefined,
      password: password || undefined,
    };
    const client = mqtt.connect(fullUrl, options);
    clientRef.current = client;
    client.on('connect', () => { setConnected(true); setConnecting(false); });
    client.on('close', () => { setConnected(false); setConnecting(false); });
    client.on('error', () => { setConnected(false); setConnecting(false); });
    client.on('message', (topic, message, packet) => {
      const time = new Date().toLocaleTimeString();
      setSubLogs((prev) => [{ time, topic, payload: message.toString(), qos: packet.qos as QoS }, ...prev]);
    });
  };

  const handleDisconnect = () => {
    if (clientRef.current) { clientRef.current.end(true); clientRef.current = null; }
    setConnected(false);
    setConnecting(false);
  };

  const handlePublish = () => {
    if (!clientRef.current || !connected) return;
    clientRef.current.publish(pubTopic, pubMsg, { qos: pubQoS });
    const time = new Date().toLocaleTimeString();
    setPubLogs((prev) => [{ time, topic: pubTopic, payload: pubMsg, qos: pubQoS }, ...prev]);
    setPubMsg('');
  };

  const handleAddSub = () => {
    if (!clientRef.current || !newSubTopic.trim()) return;
    clientRef.current.subscribe(newSubTopic.trim(), { qos: newSubQoS }, (err) => {
      if (!err) {
        const time = new Date().toLocaleTimeString();
        setSubLogs((prev) => [{ time, topic: newSubTopic.trim(), payload: t('websocket.subscribed'), qos: newSubQoS }, ...prev]);
      }
    });
    setSubTopics((prev) => [...prev, { topic: newSubTopic.trim(), qos: newSubQoS }]);
    setNewSubTopic('');
    setNewSubQoS(0);
  };

  const handleRemoveSub = (topic: string) => {
    if (!clientRef.current) return;
    clientRef.current.unsubscribe(topic);
    setSubTopics((prev) => prev.filter((s) => s.topic !== topic));
    const time = new Date().toLocaleTimeString();
    setSubLogs((prev) => [{ time, topic, payload: t('websocket.unsubscribed'), qos: 0 }, ...prev]);
  };

  useEffect(() => { subConsoleRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [subLogs]);
  useEffect(() => { pubConsoleRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [pubLogs]);

  const inputDisabled = connected || connecting;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
            {t('websocket.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Test MQTT connections over WebSocket
          </Typography>
        </Box>
        <Chip
          icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: connected ? '#22C55E' : '#64748B', ml: 1 }} />}
          label={connected ? 'Connected' : 'Disconnected'}
          size="small"
          sx={{
            bgcolor: connected ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
            color: connected ? '#5BE49B' : '#94A3B8',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid',
            borderColor: connected ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.15)',
          }}
        />
      </Stack>

      {/* Connection Panel */}
      <Box sx={{ ...cardSx, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
          Connection
        </Typography>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField size="small" fullWidth label={t('websocket.url')} value={url} onChange={(e) => setUrl(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 3, sm: 1.5 }}>
            <TextField size="small" fullWidth label={t('websocket.port')} value={port} onChange={(e) => setPort(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 3, sm: 1.5 }}>
            <TextField size="small" fullWidth label={t('websocket.path')} value={path} onChange={(e) => setPath(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 4, sm: 1.5 }}>
            <TextField size="small" fullWidth select label={t('websocket.protocol')} value={protocol} onChange={(e) => setProtocol(e.target.value as any)} disabled={inputDisabled}>
              <MenuItem value="ws">ws</MenuItem>
              <MenuItem value="wss">wss</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, sm: 2 }}>
            <TextField size="small" fullWidth label={t('websocket.username')} value={username} onChange={(e) => setUsername(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 4, sm: 2.5 }}>
            <TextField size="small" fullWidth label={t('websocket.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 8, sm: 4 }}>
            <TextField size="small" fullWidth label={t('websocket.clientId')} value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={inputDisabled} />
          </Grid>
          <Grid size={{ xs: 4, sm: 2 }}>
            <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
                disabled={inputDisabled}
                size="small"
                fullWidth
                sx={{ height: 40 }}
              >
                {connecting ? t('websocket.connecting') : t('websocket.connect')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                disabled={!connected && !connecting}
                size="small"
                fullWidth
                sx={{ height: 40 }}
              >
                {t('websocket.disconnect')}
              </Button>
            </Stack>
          </Grid>
        </Grid>
        {connected && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1.5, display: 'block', fontFamily: 'JetBrains Mono Variable', fontSize: '0.72rem' }}>
            {fullUrl}
          </Typography>
        )}
      </Box>

      {/* Publish + Subscribe */}
      <Grid container spacing={3}>
        {/* Publish */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('websocket.publish')}
            </Typography>

            <TextField size="small" fullWidth label={t('websocket.topic')} value={pubTopic} onChange={(e) => setPubTopic(e.target.value)} sx={{ mb: 1.5 }} disabled={!connected} />
            <TextField size="small" fullWidth label={t('websocket.message')} value={pubMsg} onChange={(e) => setPubMsg(e.target.value)} sx={{ mb: 1.5 }} disabled={!connected} multiline minRows={2} />

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TextField size="small" select label={t('websocket.qos')} value={pubQoS} onChange={(e) => setPubQoS(Number(e.target.value) as QoS)} sx={{ width: 80 }} disabled={!connected}>
                <MenuItem value={0}>0</MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handlePublish} disabled={!connected} size="small" sx={{ height: 40 }}>
                {t('websocket.publish')}
              </Button>
              <Button variant="outlined" color="inherit" onClick={() => setPubLogs([])} size="small" sx={{ height: 40 }}>
                {t('websocket.clear')}
              </Button>
            </Stack>

            <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary', fontSize: '0.65rem' }}>
              {t('websocket.publishConsole')}
            </Typography>
            <Box ref={pubConsoleRef} sx={{ ...consoleSx, flex: 1, minHeight: 180 }}>
              {pubLogs.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.4)' }}>No messages published yet</Typography>
              ) : pubLogs.map((log, i) => (
                <Box key={i} sx={{ mb: 0.75, py: 0.25 }}>
                  <Typography component="span" sx={{ color: '#64748B', fontSize: '0.7rem', fontFamily: 'JetBrains Mono Variable', mr: 1 }}>{log.time}</Typography>
                  <Typography component="span" sx={{ color: '#5BE49B', fontSize: '0.78rem', fontFamily: 'JetBrains Mono Variable' }}>{log.topic}</Typography>
                  <Typography component="span" sx={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'JetBrains Mono Variable' }}> qos:{log.qos} </Typography>
                  <Typography component="span" sx={{ color: '#E2E8F0', fontSize: '0.78rem', fontFamily: 'JetBrains Mono Variable' }}>{log.payload}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Subscribe */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('websocket.subscribe')}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField size="small" fullWidth placeholder={t('websocket.topic')} value={newSubTopic} onChange={(e) => setNewSubTopic(e.target.value)} disabled={!connected} />
              <TextField size="small" select value={newSubQoS} onChange={(e) => setNewSubQoS(Number(e.target.value) as QoS)} sx={{ width: 80, flexShrink: 0 }} disabled={!connected}>
                <MenuItem value={0}>0</MenuItem>
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handleAddSub} disabled={!connected} size="small" sx={{ height: 40, flexShrink: 0, px: 3 }}>
                {t('websocket.add')}
              </Button>
            </Stack>

            {/* Active subscriptions */}
            {subTopics.length > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
                {subTopics.map((s) => (
                  <Chip
                    key={s.topic}
                    label={`${s.topic} (QoS ${s.qos})`}
                    size="small"
                    onDelete={connected ? () => handleRemoveSub(s.topic) : undefined}
                    sx={{
                      bgcolor: 'rgba(0,167,111,0.1)',
                      color: '#5BE49B',
                      border: '1px solid rgba(0,167,111,0.2)',
                      fontFamily: 'JetBrains Mono Variable',
                      fontSize: '0.75rem',
                      '& .MuiChip-deleteIcon': { color: 'rgba(91,228,155,0.5)', '&:hover': { color: '#FF5630' } },
                    }}
                  />
                ))}
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                {t('websocket.subscribeConsole')}
              </Typography>
              <Button variant="text" color="inherit" onClick={() => setSubLogs([])} size="small" sx={{ fontSize: '0.7rem', minWidth: 'auto', color: 'text.secondary' }}>
                {t('websocket.clear')}
              </Button>
            </Stack>
            <Box ref={subConsoleRef} sx={{ ...consoleSx, flex: 1, minHeight: 240 }}>
              {subLogs.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.4)' }}>Waiting for messages...</Typography>
              ) : subLogs.map((log, i) => (
                <Box key={i} sx={{ mb: 0.75, py: 0.25 }}>
                  <Typography component="span" sx={{ color: '#64748B', fontSize: '0.7rem', fontFamily: 'JetBrains Mono Variable', mr: 1 }}>{log.time}</Typography>
                  <Typography component="span" sx={{ color: '#5BE49B', fontSize: '0.78rem', fontFamily: 'JetBrains Mono Variable' }}>{log.topic}</Typography>
                  <Typography component="span" sx={{ color: '#64748B', fontSize: '0.72rem', fontFamily: 'JetBrains Mono Variable' }}> qos:{log.qos} </Typography>
                  <Typography component="span" sx={{ color: '#E2E8F0', fontSize: '0.78rem', fontFamily: 'JetBrains Mono Variable' }}>{log.payload}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
