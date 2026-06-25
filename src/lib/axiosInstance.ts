import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAppHost } from "@/lib/appHost";

// Usar la URL del navegador actual en lugar de localhost
const getBaseURL = () => {
    if (typeof window !== "undefined") {
        // En el cliente, usar el origin actual del navegador
        return window.location.origin;
    }
    return getAppHost();
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (config.data instanceof FormData) {
            config.headers.delete("Content-Type");
        }
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
