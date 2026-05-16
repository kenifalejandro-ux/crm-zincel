/**client/src/context/AuthContex.tsx*/

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getMeApi, logoutApi } from "../services/auth.api";

export interface UsuarioPayload {
  id:     string;
  nombre: string;
  email:  string;
  rol:    string;
}

interface AuthContextType {
  usuario:       UsuarioPayload | null;
  token:         string | null;
  cargando:      boolean;
  login:         (token: string, usuario: UsuarioPayload) => void;
  logout:        () => Promise<void>;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario]   = useState<UsuarioPayload | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenGuardado   = localStorage.getItem("crm_token");
    const usuarioGuardado = localStorage.getItem("crm_usuario");

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  function login(token: string, usuario: UsuarioPayload) {
    localStorage.setItem("crm_token",   token);
    localStorage.setItem("crm_usuario", JSON.stringify(usuario));
    setToken(token);
    setUsuario(usuario);
  }

  async function logout() {
    try { await logoutApi(); } catch {}
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_usuario");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      cargando,
      login,
      logout,
      estaAutenticado: !!token && !!usuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}