import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';

import { DashboardContent } from 'src/layouts/dashboard';
import { useSessionStore } from 'src/stores/session-store';
import { useTopicStore } from 'src/stores/topic-store';
import { useListenerStore } from 'src/stores/listener-store';

import StatCard from './stat_card';
import RecentClients from './recent_clients';
import TopicsOverview from './topics_overview';

export default function HomeView() {
    const { t } = useTranslation();

    const sessionStore = useSessionStore();
    const topicStore = useTopicStore();
    const listenerStore = useListenerStore();

    useEffect(() => {
        sessionStore.fetch(0, 5);
        topicStore.fetch();
        listenerStore.fetch();
    }, []);

    const error = sessionStore.error || topicStore.error || listenerStore.error;
    const clearAllErrors = () => {
        sessionStore.clearError();
        topicStore.clearError();
        listenerStore.clearError();
    };

    return (
        <DashboardContent maxWidth="xl">
            <Box sx={{ py: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                    {t('welcome')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    CoreMQ MQTT Broker Admin Panel
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={clearAllErrors}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        label="Connected Clients"
                        value={sessionStore.loading ? null : sessionStore.totalElements}
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
                        value={topicStore.loading ? null : topicStore.topics.length}
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
                        value={topicStore.loading ? null : topicStore.totalSubscriptions}
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
                        value={listenerStore.loading ? null : listenerStore.listeners.length}
                        icon="lucide:radio-tower"
                        color="#FF5630"
                        trend="neutral"
                        trendValue="Ports"
                        footer="TCP / WS / TLS"
                        subtitle="Running transport listeners"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <RecentClients sessions={sessionStore.loading ? null : sessionStore.sessions} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <TopicsOverview topics={topicStore.loading ? null : topicStore.topics} />
                </Grid>
            </Grid>
        </DashboardContent>
    );
}
