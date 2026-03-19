import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";

import { Iconify } from "src/components/iconify";
import { useUserStore } from "src/stores/user-store";

export function AdminView() {
  const { users, loading, error, fetch: fetchUsers, create, clearError } = useUserStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setFormError(t("admin.validationRequired"));
      return;
    }

    setCreating(true);
    setFormError(null);
    const success = await create({
      username: newUsername,
      password_hash: newPassword,
      role: newRole,
    });
    setCreating(false);

    if (success) {
      setDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
    } else {
      setFormError("Failed to create user");
    }
  };

  const roleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "error";
      case "user": return "primary";
      default: return "default";
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ m: 3, display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3, display: "flex", flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 2, sm: 0 } }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
            {t("admin.title")}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={() => setDialogOpen(true)}
            size="small"
          >
            {t("admin.addUser")}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" width={18} />}
            onClick={fetchUsers}
            size="small"
          >
            {t("sessions.refresh")}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <Alert severity="info">{t("admin.empty")}</Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>{t("admin.username")}</TableCell>
                  <TableCell>{t("admin.role")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.username}>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{user.username}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={roleColor(user.role) as any}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("admin.addUser")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label={t("admin.username")}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
          <TextField
            label={t("admin.password")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl size="small" fullWidth>
            <InputLabel>{t("admin.role")}</InputLabel>
            <Select
              value={newRole}
              label={t("admin.role")}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            {t("admin.cancel")}
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? t("admin.creating") : t("admin.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
