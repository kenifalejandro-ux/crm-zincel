/**client/src/context/AuthContex.tsx*/

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from "react";
import { getMeApi, logoutApi } from "../services/auth.api";

export interface UsuarioPayload {
  id:     string;
  nombre: string;
  email:  string;
  rol:    string;
}

interface AuthContextType {
  usuario:         UsuarioPayload | null;
  token:           string | null;
  cargando:        boolean;
  login:           (token: string, usuario: UsuarioPayload) => void;
  logout:          () => Promise<void>;
  estaAutenticado: boolean;
}

const INACTIVIDAD_MS = 10 * 60 * 1000; // 10 minutos
const AVISO_MS       =  9 * 60 * 1000; // aviso al minuto 9

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario,    setUsuario]    = useState<UsuarioPayload | null>(null);
  const [token,      setToken]      = useState<string | null>(null);
  const [cargando,   setCargando]   = useState(true);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [cuenta,     setCuenta]     = useState(60); // segundos restantes en el aviso

  const timerLogout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerAviso   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCuenta  = useRef<ReturnType<typeof setInterval> | null>(null);

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
    limpiarTimers();
    try { await logoutApi(); } catch {}
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_usuario");
    setToken(null);
    setUsuario(null);
    setMostrarAviso(false);
  }

  function limpiarTimers() {
    if (timerLogout.current) clearTimeout(timerLogout.current);
    if (timerAviso.current)  clearTimeout(timerAviso.current);
    if (timerCuenta.current) clearInterval(timerCuenta.current);
  }

  const resetInactividad = useCallback(() => {
    if (!token) return;
    setMostrarAviso(false);
    limpiarTimers();

    timerAviso.current = setTimeout(() => {
      setMostrarAviso(true);
      setCuenta(60);
      timerCuenta.current = setInterval(() => {
        setCuenta(c => Math.max(c - 1, 0));
      }, 1000);
    }, AVISO_MS);

    timerLogout.current = setTimeout(() => {
      sessionStorage.setItem("crm_session_msg", "Sesión cerrada por inactividad.");
      logout();
    }, INACTIVIDAD_MS);
  }, [token]);

  // Inicia/reinicia timers cuando el usuario está autenticado
  useEffect(() => {
    if (!token) return;
    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach(ev => window.addEventListener(ev, resetInactividad, { passive: true }));
    resetInactividad();
    return () => {
      eventos.forEach(ev => window.removeEventListener(ev, resetInactividad));
      limpiarTimers();
    };
  }, [token, resetInactividad]);

  return (
    <AuthContext.Provider value={{
      usuario, token, cargando, login, logout,
      estaAutenticado: !!token && !!usuario,
    }}>
      {children}

      {/* ── Aviso de inactividad ──────────────────────────────────────────── */}
      {mostrarAviso && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999]
                        bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl
                        px-5 py-4 flex items-center gap-4 max-w-sm w-full mx-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">¿Sigues ahí?</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tu sesión se cerrará en <span className="text-amber-400 font-semibold">{cuenta}s</span> por inactividad.
            </p>
          </div>
          <button
            onClick={resetInactividad}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition shrink-0"
          >
            Continuar
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
