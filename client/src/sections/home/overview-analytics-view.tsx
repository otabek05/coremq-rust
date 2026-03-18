import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { DashboardContent } from 'src/layouts/dashboard';

export function HomeView() {
  const { t } = useTranslation();

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
          {t('welcome')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          CoreMQ MQTT Broker Admin Panel
        </Typography>
      </Box>
    </DashboardContent>
  );
}
