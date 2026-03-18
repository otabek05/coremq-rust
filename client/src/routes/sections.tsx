import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';
import ProtectedRoute from './protected_route';


export const DashboardPage = lazy(() => import('src/pages/home'));
export const AdminPage = lazy(() => import('src/pages/admin'));
export const SessionPage = lazy(() => import('src/pages/session'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const ListenerPage = lazy(() => import('src/pages/listener'));
export const WebhookPage = lazy(() => import('src/pages/webhook'));
export const WebsocketPage = lazy(()=> import('src/pages/websocket'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));



const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);


export const routesSection: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <DashboardLayout>
            <Suspense fallback={renderFallback()}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'sessions', element: <SessionPage /> },
          { path: 'listeners', element: <ListenerPage /> },
          { path: 'admins', element: <AdminPage /> },
          { path: 'webhooks', element: <WebhookPage /> },
          {path: 'websockets', element: <WebsocketPage /> }
        ],
      },
    ],
  },

  {
    path: 'sign-in',
    element: (
      <AuthLayout>
        <Suspense fallback={renderFallback()}>
          <SignInPage />
        </Suspense>
      </AuthLayout>
    ),
  },

  {
    path: '404',
    element: (
      <Suspense fallback={renderFallback()}>
        <Page404 />
      </Suspense>
    ),
  },

  {
    path: '*',
    element: <Page404 />,
  },
];