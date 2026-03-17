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
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import { Iconify } from "src/components/iconify";
import type { Session } from "src/types/sessions";
import { fetchSessions, deleteSession } from "src/services/sessions";

export function SessionView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const loadSessions = async (pageNumber = 0, searchValue = search, pageSize = size) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSessions(pageNumber, pageSize, searchValue);
      setSessions(data?.data?.content ?? []);
      setPage(data?.data?.page ?? 0);
      setTotalPages(data?.data?.total_pages ?? 1);
      setTotalElements(data?.data?.total_elements ?? 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = async (clientId: string) => {
    if (!window.confirm(`Disconnect client ${clientId}?`)) return;
    try {
      await deleteSession(clientId);
      loadSessions(page);
    } catch (err: any) {
      setError(err?.message || "Failed to disconnect client");
    }
  };

  if (loading && sessions.length === 0) {
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
          {t("sessions.title")} ({totalElements})
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder={t("sessions.search") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadSessions(0, search);
            }}
          />
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:magnify" />}
            onClick={() => loadSessions(0, search)}
          >
            {t("sessions.search")}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" />}
            onClick={() => loadSessions(page)}
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

      {!loading && sessions.length === 0 ? (
        <Alert severity="info">{t("sessions.empty")}</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: "75vh", border: "1px solid #ddd" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  t("sessions.id"),
                  t("sessions.clientId"),
                  t("sessions.username"),
                  t("sessions.remoteAddress"),
                  t("sessions.port"),
                  t("sessions.connectedAt"),
                  t("sessions.subscriptions"),
                  t("sessions.actions"),
                ].map((h) => (
                  <TableCell key={h} sx={{ border: "1px solid #ddd", fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session, index) => (
                <TableRow key={session.client_id} hover>
                  <TableCell sx={{ border: "1px solid #eee" }}>
                    {page * size + index + 1}
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{session.client_id}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{session.username || "-"}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{session.remote_addr}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{session.connected_port}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{session.connected_at}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>
                    {Object.keys(session.subscriptions).length}
                  </TableCell>
                  <TableCell align="center" sx={{ border: "1px solid #eee" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(session.client_id)}
                    >
                      <Iconify icon="mdi:delete-outline" width={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {sessions.length > 0 && (
        <Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={3}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => loadSessions(value - 1)}
            color="primary"
          />
          <FormControl size="small">
            <Select
              value={size}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setSize(newSize);
                loadSessions(0, search, newSize);
              }}
            >
              <MenuItem value={5}>5 / page</MenuItem>
              <MenuItem value={10}>10 / page</MenuItem>
              <MenuItem value={20}>20 / page</MenuItem>
              <MenuItem value={50}>50 / page</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}
