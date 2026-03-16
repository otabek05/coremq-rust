import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import { Iconify } from "src/components/iconify";
import type { Listener } from "src/types/listeners";
import { fetchListeners, stopListener } from "src/services/listeners";

export function ListenerView() {
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const loadListeners = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListeners();
      setListeners(data ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load listeners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListeners();
  }, []);

  const handleStop = async (port: number, name: string) => {
    if (!window.confirm(`Stop listener "${name}" on port ${port}?`)) return;
    try {
      await stopListener(port);
      loadListeners();
    } catch (err: any) {
      setError(err?.message || "Failed to stop listener");
    }
  };

  const protocolColor = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case "tcp": return "primary";
      case "tls": return "success";
      case "ws": return "warning";
      case "wss": return "info";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ m: 2, display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ m: 2 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t("listeners.title")} ({listeners.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" />}
            onClick={loadListeners}
          >
            {t("sessions.refresh")}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {listeners.length === 0 ? (
        <Alert severity="info">{t("listeners.empty")}</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: "75vh", border: "1px solid #ddd" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  "#",
                  t("listeners.name"),
                  t("listeners.protocol"),
                  t("listeners.host"),
                  t("listeners.port"),
                  t("listeners.tls"),
                  t("sessions.actions"),
                ].map((h) => (
                  <TableCell key={h} sx={{ border: "1px solid #ddd", fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {listeners.map((listener, index) => (
                <TableRow key={`${listener.name}-${listener.port}`} hover>
                  <TableCell sx={{ border: "1px solid #eee" }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{listener.name}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>
                    <Chip
                      label={listener.protocol.toUpperCase()}
                      color={protocolColor(listener.protocol) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{listener.host}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{listener.port}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>
                    {listener.tls ? (
                      <Chip label="Enabled" color="success" size="small" variant="outlined" />
                    ) : (
                      <Chip label="Disabled" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #eee" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleStop(listener.port, listener.name)}
                    >
                      <Iconify icon="mdi:stop-circle-outline" width={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
