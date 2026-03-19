import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

/** Cookie key constants */
const TOKEN_KEYS = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token',
} as const;

/** Cookie options */
const COOKIE_OPTIONS = { path: '/' } as const;

/** API base URL derived from current hostname */
const API_BASE = `http://${window.location.hostname}:18083`;

/** Axios instance for all API calls */
export const api = axios.create({ baseURL: API_BASE });

/** Queue for requests that arrived while a token refresh is in progress */
type QueueItem = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

/** Resolve or reject all queued requests once refresh completes */
function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach((item) => {
        if (error) {
            item.reject(error);
        } else if (token) {
            item.resolve(token);
        }
    });
    failedQueue = [];
}

/** Read a token from cookies */
function getToken(key: string): string | undefined {
    return Cookies.get(key);
}

/** Persist a token to cookies with expiry */
function setToken(key: string, value: string, expiresDays: number) {
    Cookies.set(key, value, { ...COOKIE_OPTIONS, expires: expiresDays });
}

/** Clear all auth tokens and force reload to sign-in */
function logout() {
    Cookies.remove(TOKEN_KEYS.ACCESS, COOKIE_OPTIONS);
    Cookies.remove(TOKEN_KEYS.REFRESH, COOKIE_OPTIONS);
    window.location.reload();
}

/** Attempt to refresh the access token using the refresh token */
async function refreshAccessToken(): Promise<string> {
    const refreshToken = getToken(TOKEN_KEYS.REFRESH);

    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const { data } = await axios.post(
        `${API_BASE}/api/v1/auth/refresh-token`,
        { refresh_token: refreshToken },
        { headers: { Authorization: `Bearer ${refreshToken}` } },
    );

    const newAccessToken: string = data?.data?.access_token;
    const newRefreshToken: string = data?.data?.refresh_token;

    setToken(TOKEN_KEYS.ACCESS, newAccessToken, 1);
    setToken(TOKEN_KEYS.REFRESH, newRefreshToken, 7);

    return newAccessToken;
}

/** Attach bearer token to every outgoing request */
api.interceptors.request.use((config) => {
    const token = getToken(TOKEN_KEYS.ACCESS);

    if (token && config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

/** Handle 401 responses with automatic token refresh */
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        /** If a refresh is already in progress, queue this request */
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.set('Authorization', `Bearer ${token}`);
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newToken = await refreshAccessToken();

            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);

            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            logout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);
