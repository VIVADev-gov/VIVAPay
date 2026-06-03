import axios, { type InternalAxiosRequestConfig } from "axios";

// Usar la URL del navegador actual en lugar de localhost
const getBaseURL = () => {
    if (typeof window !== "undefined") {
        // En el cliente, usar el origin actual del navegador
        return window.location.origin;
    }
    // En el servidor, usar la variable de entorno o fallback
    return process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
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
