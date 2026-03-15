
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DashboardContent } from 'src/layouts/dashboard';


export function HomeView() {
    const { t } = useTranslation();
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        <h1>{t('welcome')}</h1>
      </Typography>

    </DashboardContent>
  );
}
