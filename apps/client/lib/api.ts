import axios, { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { refreshAccessToken } from "./auth.service";
import { logger } from "./logger";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.helpingbots.in";
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request Interceptor

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.url !== "/auth/refresh") {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error("Axios request interceptor error", error);
    return Promise.reject(error);
  }
);

// Response Interceptor

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      logger.error("Non-Axios error in response interceptor", error);
      return Promise.reject(error);
    }
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        logger.log("Waiting for token refresh...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((error) => {
            return Promise.reject(error);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      logger.log("Token expired, Attempting refresh...");

      try {
        const { accessToken } = await refreshAccessToken();
        logger.log("Token refreshed successfully");
        useAuthStore.getState().setToken(accessToken);
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError: unknown) {
        logger.error(
          "Token refresh failed. Clearing client state.",
          refreshError
        );
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
