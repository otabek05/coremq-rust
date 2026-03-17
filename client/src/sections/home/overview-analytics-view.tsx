import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DashboardContent } from 'src/layouts/dashboard';

export function HomeView() {
  const { t } = useTranslation();

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {t('welcome')}
      </Typography>
    </DashboardContent>
  );
}
