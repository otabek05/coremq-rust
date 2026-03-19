import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import { Iconify } from "src/components/iconify";
import { useTopicStore } from "src/stores/topic-store";

import TopicTable from "./topic_table";
import PublishDrawer from "./publish_drawer";

export default function TopicView() {
  const { topics, loading, error, fetch: fetchTopics, clearError } = useTopicStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTopic, setDrawerTopic] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    fetchTopics();
  }, []);

  const openPublish = (topic = "") => {
    setDrawerTopic(topic);
    setDrawerOpen(true);
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
            onClick={() => openPublish()}
            size="small"
            sx={{ height: 36 }}
          >
            {t("topics.publishMessage")}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" width={18} />}
            onClick={() => fetchTopics()}
            size="small"
            sx={{ height: 36 }}
          >
            {t("topics.refresh")}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {!loading && topics.length === 0 ? (
        <Alert severity="info">{t("topics.empty")}</Alert>
      ) : (
        <TopicTable topics={topics} onPublish={openPublish} t={t} />
      )}

      <PublishDrawer
        open={drawerOpen}
        topic={drawerTopic}
        onClose={() => setDrawerOpen(false)}
        t={t}
      />
    </Box>
  );
}
