import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Cookies from 'js-cookie';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const token = Cookies.get('access_token');

        if (token) {
            setAuthenticated(true);
        } else {
            setAuthenticated(false);
        }

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flex: '1 1 auto',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <LinearProgress sx={{ width: 1, maxWidth: 320 }} />
            </Box>
        );
    }

    return authenticated ? <Outlet /> : <Navigate to="/sign-in" replace />;
}
