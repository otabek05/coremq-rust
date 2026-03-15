import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: `http://${window.location.hostname}:18083` //BASE_URL,
});

let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}[] = [];

function processQueue(error: any, token: string | null = null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });

    failedQueue = [];
}

function logout() {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.reload();
}

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("access_token");

        if (token && config.headers) {
            config.headers.set("Authorization", `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        if (error.response.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.set("Authorization", `Bearer ${token}`);
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = Cookies.get("refresh_token");

            try {
                const { data } = await axios.post(
                    `${BASE_URL}/api/v1/auth/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    }
                );

                const newAccessToken = data?.data?.access_token;
                const newRefreshToken = data?.data?.refresh_token;

                Cookies.set("access_token", newAccessToken);
                Cookies.set("refresh_token", newRefreshToken);

                api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);

                originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

                return api(originalRequest);

            } catch (err) {
                processQueue(err, null);
                logout();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);