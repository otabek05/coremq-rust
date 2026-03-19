import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";

import { Iconify } from "src/components/iconify";
import { publishMessage } from "src/services/topics";

type Props = {
  open: boolean;
  topic: string;
  onClose: () => void;
  t: (key: string) => string;
};

export default function PublishDrawer({ open, topic, onClose, t }: Props) {
  const [topicValue, setTopicValue] = useState(topic);
  const [payload, setPayload] = useState("");
  const [qos, setQos] = useState(0);
  const [retain, setRetain] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTopicValue(topic);
    setPayload("");
    setQos(0);
    setRetain(false);
    setSuccess(null);
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
  };

  const handlePublish = async () => {
    if (!topicValue.trim()) return;
    setPublishing(true);
    setSuccess(null);
    setError(null);
    try {
      await publishMessage({
        topic: topicValue.trim(),
        payload,
        qos,
        retain,
      });
      setSuccess(`Message published to "${topicValue.trim()}"`);
    } catch (err: any) {
      setError(err?.message || "Failed to publish message");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      onTransitionEnter={handleOpen}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: "50%" },
          bgcolor: "#131825",
          borderLeft: "1px solid rgba(148,163,184,0.12)",
          boxShadow: "none",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("topics.publishMessage")}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: "text.secondary" }}
            >
              <Iconify icon="mdi:close" width={20} />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                {t("topics.topic")}
              </Typography>
              <TextField
                value={topicValue}
                onChange={(e) => setTopicValue(e.target.value)}
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
            </Box>

            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                {t("topics.payload")}
              </Typography>
              <TextField
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                maxRows={12}
                size="small"
                placeholder='e.g. {"temperature": 23.5}'
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "JetBrains Mono Variable",
                    fontSize: "0.85rem",
                  },
                }}
              />
            </Box>

            <Divider sx={{ borderColor: "rgba(148,163,184,0.1)" }} />

            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <Typography variant="overline" sx={{ color: "text.secondary", mb: 0.5, display: "block" }}>
                  QoS
                </Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={qos}
                    onChange={(e) => setQos(Number(e.target.value))}
                    sx={{ fontSize: "0.85rem" }}
                  >
                    <MenuItem value={0}>QoS 0</MenuItem>
                    <MenuItem value={1}>QoS 1</MenuItem>
                    <MenuItem value={2}>QoS 2</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ pt: 2.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={retain}
                      onChange={(e) => setRetain(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                      {t("topics.retain")}
                    </Typography>
                  }
                />
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: "1px solid rgba(148,163,184,0.1)" }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handlePublish}
            disabled={publishing || !topicValue.trim()}
            startIcon={
              publishing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="mdi:send" width={18} />
              )
            }
            sx={{ py: 1.2 }}
          >
            {publishing ? t("topics.publishing") : t("topics.publish")}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
