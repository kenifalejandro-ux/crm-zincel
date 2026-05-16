/**client/src/services/auth.api.ts*/

import api from "./api";
import type { UsuarioPayload } from "../context/AuthContext";

export async function loginApi(email: string, password: string, recaptchaToken: string) {
  const { data } = await api.post("/auth/login", { email, password, recaptchaToken });
  return data as { ok: boolean; token: string; usuario: UsuarioPayload };
}

export async function logoutApi() {
  await api.post("/auth/logout");
}

export async function getMeApi() {
  const { data } = await api.get("/auth/me");
  return data.usuario as UsuarioPayload;
}

export async function cambiarPasswordApi(password_actual: string, password_nuevo: string) {
  const { data } = await api.put("/auth/cambiar-password", { password_actual, password_nuevo });
  return data;
}