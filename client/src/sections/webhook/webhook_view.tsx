import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';

export function WebhookView() {
    const { t } = useTranslation();

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: { xs: '1.4rem', sm: '2.125rem' } }}
                >
                    {t('webhook.title')}
                </Typography>
            </Box>

            <Alert severity="info" icon={<Iconify icon="mdi:webhook" width={22} />}>
                {t('webhook.comingSoon')}
            </Alert>
        </Box>
    );
}
