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

const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#1A2035',
        '& input': {
            color: '#E2E8F0',
            '&:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 100px #1A2035 inset',
                WebkitTextFillColor: '#E2E8F0',
                caretColor: '#E2E8F0',
            },
        },
    },
    '& .MuiInputLabel-root': {
        color: '#64748B',
    },
};

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

            Cookies.set('access_token', response.data!.access_token, { expires: 1, path: '/' });
            Cookies.set('refresh_token', response.data!.refresh_token, { expires: 7, path: '/' });
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
                    gap: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #00A76F, #007867)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        mb: 2,
                    }}
                >
                    MQ
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Sign in
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    CoreMQ Broker Admin Panel
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <TextField
                    fullWidth
                    name="username"
                    label="Username"
                    value={form.username}
                    onChange={handleChange}
                    sx={{ ...inputSx, mb: 2 }}
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
                                        sx={{ color: '#64748B' }}
                                    >
                                        <Iconify icon={showPassword ? 'lucide:eye' : 'lucide:eye-off'} width={18} />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{ ...inputSx, mb: 3 }}
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
                    color="primary"
                    variant="contained"
                    onClick={handleSignIn}
                    disabled={loading}
                    sx={{ py: 1.4 }}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>
            </Box>
        </>
    );
}
