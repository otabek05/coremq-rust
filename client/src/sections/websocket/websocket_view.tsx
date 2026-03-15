import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { useTranslation } from 'react-i18next';

export type QoS = 0 | 1 | 2;
type LogItem = { time: string; topic: string; payload: string; qos: QoS };

export function WebsocketView() {
  const { t } = useTranslation();

  // --- Connection ---
  const [url, setUrl] = useState('localhost');
  const [port, setPort] = useState('8083');
  const [path, setPath] = useState('/mqtt');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState(`mqttjs_${Math.random().toString(16).substr(2, 8)}`);
  const [protocol, setProtocol] = useState<'ws' | 'wss'>('ws');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // --- MQTT Client Ref ---
  const clientRef = useRef<MqttClient | null>(null);

  const fullUrl = `${protocol}://${url}:${port}${path.startsWith('/') ? path : `/${path}`}`;

  // --- Subscribe ---
  const [subTopics, setSubTopics] = useState<{ topic: string; qos: QoS }[]>([]);
  const [newSubTopic, setNewSubTopic] = useState('');
  const [newSubQoS, setNewSubQoS] = useState<QoS>(0);

  // --- Publish ---
  const [pubTopic, setPubTopic] = useState('test/topic');
  const [pubMsg, setPubMsg] = useState('');
  const [pubQoS, setPubQoS] = useState<QoS>(0);

  // --- Logs ---
  const [subLogs, setSubLogs] = useState<LogItem[]>([]);
  const [pubLogs, setPubLogs] = useState<LogItem[]>([]);

  const subConsoleRef = useRef<HTMLDivElement>(null);
  const pubConsoleRef = useRef<HTMLDivElement>(null);

  // --- Connect / Disconnect ---
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

    client.on('connect', () => {
      setConnected(true);
      setConnecting(false);
    });

    client.on('close', () => {
      setConnected(false);
      setConnecting(false);
    });

    client.on('error', () => {
      setConnected(false);
      setConnecting(false);
    });

    client.on('message', (topic, message, packet) => {
      const time = new Date().toLocaleTimeString();
      setSubLogs((prev) => [{ time, topic, payload: message.toString(), qos: packet.qos as QoS }, ...prev]);
    });
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  };

  // --- Publish ---
  const handlePublish = () => {
    if (!clientRef.current || !connected) return;
    clientRef.current.publish(pubTopic, pubMsg, { qos: pubQoS });
    const time = new Date().toLocaleTimeString();
    setPubLogs((prev) => [{ time, topic: pubTopic, payload: pubMsg, qos: pubQoS }, ...prev]);
    setPubMsg('');
  };

  // --- Subscribe ---
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

  // --- Clear Logs ---
  const clearSubLogs = () => setSubLogs([]);
  const clearPubLogs = () => setPubLogs([]);

  // --- Auto-scroll consoles ---
  useEffect(() => { subConsoleRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [subLogs]);
  useEffect(() => { pubConsoleRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [pubLogs]);

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>{t('websocket.title')}</Typography>

      {/* Connection Panel */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Stack spacing={1} direction="row" flexWrap="wrap" alignItems="center">
          <TextField size="small" label={t('websocket.url')} value={url} onChange={(e) => setUrl(e.target.value)} disabled={connected || connecting} />
          <TextField size="small" label={t('websocket.port')} value={port} onChange={(e) => setPort(e.target.value)} sx={{ width: 100 }} disabled={connected || connecting} />
          <TextField size="small" label={t('websocket.path')} value={path} onChange={(e) => setPath(e.target.value)} sx={{ width: 120 }} disabled={connected || connecting} />
          <TextField size="small" select label={t('websocket.protocol')} value={protocol} onChange={(e) => setProtocol(e.target.value as any)} sx={{ width: 80 }} disabled={connected || connecting}>
            <MenuItem value="ws">ws</MenuItem>
            <MenuItem value="wss">wss</MenuItem>
          </TextField>
          <TextField size="small" label={t('websocket.username')} value={username} onChange={(e) => setUsername(e.target.value)} disabled={connected || connecting} />
          <TextField size="small" label={t('websocket.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={connected || connecting} />
          <TextField size="small" label={t('websocket.clientId')} value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={connected || connecting} />
          <Button variant="contained" color="success" onClick={handleConnect} disabled={connected || connecting}>
            {connecting ? t('websocket.connecting') : t('websocket.connect')}
          </Button>
          <Button variant="outlined" color="error" onClick={handleDisconnect} disabled={!connected && !connecting}>{t('websocket.disconnect')}</Button>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={4}>
        {/* Publish Panel */}
        <Paper sx={{ p: 2, width: 300 }}>
          <Typography variant="h6">{t('websocket.publish')}</Typography>
          <TextField size="small" fullWidth label={t('websocket.topic')} value={pubTopic} onChange={(e) => setPubTopic(e.target.value)} sx={{ mb: 1 }} disabled={!connected} />
          <TextField size="small" fullWidth label={t('websocket.message')} value={pubMsg} onChange={(e) => setPubMsg(e.target.value)} sx={{ mb: 1 }} disabled={!connected} />
          <TextField size="small" select label={t('websocket.qos')} value={pubQoS} onChange={(e) => setPubQoS(Number(e.target.value) as QoS)} sx={{ mb: 1, width: 100 }} disabled={!connected}>
            <MenuItem value={0}>0</MenuItem>
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
          </TextField>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button variant="contained" onClick={handlePublish} disabled={!connected}>{t('websocket.publish')}</Button>
            <Button variant="outlined" onClick={clearPubLogs}>{t('websocket.clear')}</Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">{t('websocket.publishConsole')}</Typography>
          <Box ref={pubConsoleRef} sx={{ border: '1px solid #ccc', p: 1, height: 200, overflowY: 'auto', background: '#f9f9f9' }}>
            {pubLogs.map((log, i) => (
              <Box key={i} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{log.time}</Typography>
                <Typography variant="body2"><b>{log.topic}</b> [QoS {log.qos}]: {log.payload}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Subscribe Panel */}
        <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: 600 }}>
          <Typography variant="h6">{t('websocket.subscribe')}</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField size="small" fullWidth placeholder={t('websocket.topic')} value={newSubTopic} onChange={(e) => setNewSubTopic(e.target.value)} disabled={!connected} />
            <TextField size="small" select value={newSubQoS} onChange={(e) => setNewSubQoS(Number(e.target.value) as QoS)} sx={{ width: 80 }} disabled={!connected}>
              <MenuItem value={0}>0</MenuItem>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </TextField>
            <Button variant="contained" onClick={handleAddSub} disabled={!connected}>{t('websocket.add')}</Button>
          </Stack>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {subTopics.map((s) => (
              <Stack key={s.topic} direction="row" justifyContent="space-between">
                <Typography>{s.topic} [QoS {s.qos}]</Typography>
                <Button size="small" color="error" onClick={() => handleRemoveSub(s.topic)} disabled={!connected}>{t('websocket.remove')}</Button>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button variant="outlined" onClick={clearSubLogs}>{t('websocket.clear')}</Button>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">{t('websocket.subscribeConsole')}</Typography>
          <Box ref={subConsoleRef} sx={{ flex: 1, border: '1px solid #ccc', p: 1, overflowY: 'auto', background: '#f9f9f9' }}>
            {subLogs.map((log, i) => (
              <Box key={i} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{log.time}</Typography>
                <Typography variant="body2"><b>{log.topic}</b> [QoS {log.qos}]: {log.payload}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}