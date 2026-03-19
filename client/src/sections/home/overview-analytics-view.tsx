import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";

import { DashboardContent } from "src/layouts/dashboard";
import { fetchSessions } from "src/services/sessions";
import { fetchTopics } from "src/services/topics";
import { fetchListeners } from "src/services/listeners";
import type { Session } from "src/types/sessions";
import type { TopicInfo } from "src/types/topics";

import StatCard from "./stat_card";
import RecentClients from "./recent_clients";
import TopicsOverview from "./topics_overview";

type Stats = {
  clients: number | null;
  topics: number | null;
  subscriptions: number | null;
  listeners: number | null;
};

export default function HomeView() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    clients: null,
    topics: null,
    subscriptions: null,
    listeners: null,
  });
  const [recentSessions, setRecentSessions] = useState<Session[] | null>(null);
  const [topicList, setTopicList] = useState<TopicInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [sessionsRes, topicsRes, listenersRes] = await Promise.all([
        fetchSessions(0, 5),
        fetchTopics(),
        fetchListeners(),
      ]);

      const topics = topicsRes?.data ?? [];
      const totalSubs = topics.reduce((sum, tp) => sum + tp.subscriber_count, 0);
      const sessions = sessionsRes?.data?.content ?? [];

      setStats({
        clients: sessionsRes?.data?.total_elements ?? 0,
        topics: topics.length,
        subscriptions: totalSubs,
        listeners: Array.isArray(listenersRes) ? listenersRes.length : 0,
      });
      setRecentSessions(sessions);
      setTopicList(topics);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box sx={{ py: 2, mb: 1 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {t("welcome")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          CoreMQ MQTT Broker Admin Panel
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stat Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Connected Clients"
            value={stats.clients}
            icon="lucide:users"
            color="#00A76F"
            trend="up"
            trendValue="Live"
            footer="Active connections"
            subtitle="Currently connected MQTT clients"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Active Topics"
            value={stats.topics}
            icon="lucide:hash"
            color="#00B8D9"
            trend="neutral"
            trendValue="Topics"
            footer="With subscribers"
            subtitle="Topics with at least one subscriber"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Subscriptions"
            value={stats.subscriptions}
            icon="lucide:bell-ring"
            color="#FFAB00"
            trend="up"
            trendValue="Active"
            footer="Across all topics"
            subtitle="Sum of all topic subscriptions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Active Listeners"
            value={stats.listeners}
            icon="lucide:radio-tower"
            color="#FF5630"
            trend="neutral"
            trendValue="Ports"
            footer="TCP / WS / TLS"
            subtitle="Running transport listeners"
          />
        </Grid>
      </Grid>

      {/* Bottom Section: Recent Clients + Topics */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentClients sessions={recentSessions} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <TopicsOverview topics={topicList} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
