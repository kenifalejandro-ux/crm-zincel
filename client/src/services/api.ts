/**client/src/services/api.ts*/

import axios from "axios";

const api = axios.create({
  baseURL: "/api/crm",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Interceptor — agrega token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("crm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor — maneja errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLoginRoute = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !esLoginRoute) {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;