import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";

import { Iconify } from "src/components/iconify";
import type { TopicInfo } from "src/types/topics";

type Props = {
  topics: TopicInfo[];
  onPublish: (topic: string) => void;
  t: (key: string) => string;
};

export default function TopicTable({ topics, onPublish, t }: Props) {
  return (
    <Card>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }}>#</TableCell>
              <TableCell>{t("topics.topic")}</TableCell>
              <TableCell>{t("topics.subscribers")}</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>
                {t("topics.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topics.map((item, index) => (
              <TableRow key={item.topic}>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {index + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: "JetBrains Mono Variable",
                      fontSize: "0.8rem",
                    }}
                  >
                    {item.topic}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.subscriber_count}
                    size="small"
                    color={item.subscriber_count > 0 ? "primary" : "default"}
                    variant="filled"
                    sx={{ minWidth: 28, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={t("topics.publish")}>
                    <IconButton
                      size="small"
                      onClick={() => onPublish(item.topic)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      <Iconify icon="mdi:send" width={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
