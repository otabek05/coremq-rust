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
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";

import { Iconify } from "src/components/iconify";
import type { TopicInfo } from "src/types/topics";
import { fetchTopics, publishMessage } from "src/services/topics";

export function TopicView() {
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTopic, setPublishTopic] = useState("");
  const [publishPayload, setPublishPayload] = useState("");
  const [publishQos, setPublishQos] = useState(0);
  const [publishRetain, setPublishRetain] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { t } = useTranslation();

  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopics();
      setTopics(data?.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const openPublishDialog = (topic = "") => {
    setPublishTopic(topic);
    setPublishPayload("");
    setPublishQos(0);
    setPublishRetain(false);
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    if (!publishTopic.trim()) return;
    setPublishing(true);
    try {
      await publishMessage({
        topic: publishTopic.trim(),
        payload: publishPayload,
        qos: publishQos,
        retain: publishRetain,
      });
      setSnackbar(`Message published to "${publishTopic.trim()}"`);
      setPublishOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to publish message");
    } finally {
      setPublishing(false);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <Box sx={{ m: 3, display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.01em",
              fontSize: { xs: "1.4rem", sm: "2.125rem" },
            }}
          >
            {t("topics.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {topics.length} active {topics.length === 1 ? "topic" : "topics"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mdi:publish" width={18} />}
            onClick={() => openPublishDialog()}
            size="small"
            sx={{ height: 36 }}
          >
            {t("topics.publishMessage")}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" width={18} />}
            onClick={() => loadTopics()}
            size="small"
            sx={{ height: 36 }}
          >
            {t("topics.refresh")}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && topics.length === 0 ? (
        <Alert severity="info">{t("topics.empty")}</Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>{t("topics.topic")}</TableCell>
                  <TableCell>{t("topics.subscribers")}</TableCell>
                  <TableCell align="right" sx={{ width: 100 }}>
                    {t("topics.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((item, index) => (
                  <TableRow key={item.topic}>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontFamily: "JetBrains Mono Variable",
                          fontSize: "0.8rem",
                        }}
                      >
                        {item.topic}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.subscriber_count}
                        size="small"
                        color={item.subscriber_count > 0 ? "primary" : "default"}
                        variant="filled"
                        sx={{ minWidth: 28, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("topics.publish")}>
                        <IconButton
                          size="small"
                          onClick={() => openPublishDialog(item.topic)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <Iconify icon="mdi:send" width={18} />
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

      {/* Publish Dialog */}
      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#131825",
            border: "1px solid rgba(148,163,184,0.12)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("topics.publishMessage")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label={t("topics.topic")}
              value={publishTopic}
              onChange={(e) => setPublishTopic(e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g. devices/sensor/temperature"
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontFamily: "JetBrains Mono Variable",
                  fontSize: "0.85rem",
                },
              }}
            />
            <TextField
              label={t("topics.payload")}
              value={publishPayload}
              onChange={(e) => setPublishPayload(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              maxRows={8}
              size="small"
              placeholder='e.g. {"temperature": 23.5}'
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontFamily: "JetBrains Mono Variable",
                  fontSize: "0.85rem",
                },
              }}
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={publishQos}
                  onChange={(e) => setPublishQos(Number(e.target.value))}
                  sx={{ fontSize: "0.85rem" }}
                >
                  <MenuItem value={0}>QoS 0</MenuItem>
                  <MenuItem value={1}>QoS 1</MenuItem>
                  <MenuItem value={2}>QoS 2</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={publishRetain}
                    onChange={(e) => setPublishRetain(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                    {t("topics.retain")}
                  </Typography>
                }
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setPublishOpen(false)}
            color="inherit"
            size="small"
          >
            {t("topics.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePublish}
            disabled={publishing || !publishTopic.trim()}
            startIcon={
              publishing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="mdi:send" width={16} />
              )
            }
            size="small"
          >
            {publishing ? t("topics.publishing") : t("topics.publish")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbar(null)}
          sx={{ width: "100%" }}
        >
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
