import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';

import Cookies from 'js-cookie';

import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { SignInRequest, Token } from 'src/types/login';
import { signIn } from 'src/services/sigin_in';
import { ApiResponse } from 'src/types/api_response';

export function SignInView() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<SignInRequest>({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await signIn(form);
      const response = new ApiResponse(raw.data, raw.message, raw.status_code);

      if (response.isError()) {
        setError(response.message);
        return;
      }

      Cookies.set('access_token', response.data!.access_token, { expires: 1 });
      router.push('/');
    } catch (err) {
      setError('Unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [form, router]);

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign in to CoreMQ</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          MQTT Broker Admin Panel
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TextField
          fullWidth
          name="username"
          label="Username"
          value={form.username}
          onChange={handleChange}
          sx={{ mb: 3 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          fullWidth
          name="password"
          label="Password"
          value={form.password}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSignIn();
          }}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          size="large"
          type="button"
          color="inherit"
          variant="contained"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Box>
    </>
  );
}
