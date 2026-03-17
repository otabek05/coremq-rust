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

import { Iconify } from "src/components/iconify";
import type { User } from "src/types/users";
import { fetchUsers, createUser } from "src/services/users";

export function AdminView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const { t } = useTranslation();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      setUsers(res?.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setFormError(t("admin.validationRequired"));
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      await createUser({
        username: newUsername,
        password_hash: newPassword,
        role: newRole,
      });
      setDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      loadUsers();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const roleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "error";
      case "user": return "primary";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ m: 2, display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ m: 2 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t("admin.title")} ({users.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setDialogOpen(true)}
          >
            {t("admin.addUser")}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mdi:refresh" />}
            onClick={loadUsers}
          >
            {t("sessions.refresh")}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <Alert severity="info">{t("admin.empty")}</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: "75vh", border: "1px solid #ddd" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  "#",
                  t("admin.username"),
                  t("admin.role"),
                ].map((h) => (
                  <TableCell key={h} sx={{ border: "1px solid #ddd", fontWeight: 600 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.username} hover>
                  <TableCell sx={{ border: "1px solid #eee" }}>{index + 1}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>{user.username}</TableCell>
                  <TableCell sx={{ border: "1px solid #eee" }}>
                    <Chip
                      label={user.role}
                      color={roleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("admin.addUser")}</DialogTitle>
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
        <DialogActions>
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
