import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';

import { Iconify } from 'src/components/iconify';
import type { TopicInfo } from 'src/types/topics';

type Props = {
    topics: TopicInfo[] | null;
};

export default function TopicsOverview({ topics }: Props) {
    const maxSubs = topics ? Math.max(...topics.map((t) => t.subscriber_count), 1) : 1;

    return (
        <Card sx={{ p: 0, height: '100%' }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Active Topics
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Topics with active subscribers
                </Typography>
            </Box>

            <Box sx={{ px: 2.5, pb: 2.5 }}>
                {topics === null ? (
                    <Stack spacing={2}>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={38} />
                        ))}
                    </Stack>
                ) : topics.length === 0 ? (
                    <Box
                        sx={{
                            py: 4,
                            textAlign: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'rgba(148,163,184,0.04)',
                            border: '1px solid rgba(148,163,184,0.08)',
                        }}
                    >
                        <Iconify icon="lucide:hash" width={28} sx={{ color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No active topics
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.75}>
                        {topics.map((topic) => {
                            const pct = (topic.subscriber_count / maxSubs) * 100;
                            return (
                                <Box key={topic.topic}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 0.5 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'JetBrains Mono Variable',
                                                fontSize: '0.78rem',
                                                fontWeight: 500,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                                mr: 1,
                                            }}
                                        >
                                            {topic.topic}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'text.secondary',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {topic.subscriber_count}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(148,163,184,0.08)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                bgcolor: '#00B8D9',
                                            },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Card>
    );
}
