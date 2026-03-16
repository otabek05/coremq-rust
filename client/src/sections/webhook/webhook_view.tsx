import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import { Iconify } from "src/components/iconify";

export function WebhookView() {
  const { t } = useTranslation();

  return (
    <Box sx={{ m: 2 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t("webhook.title")}
        </Typography>
      </Box>

      <Alert
        severity="info"
        icon={<Iconify icon="mdi:webhook" width={24} />}
      >
        {t("webhook.comingSoon")}
      </Alert>
    </Box>
  );
}
