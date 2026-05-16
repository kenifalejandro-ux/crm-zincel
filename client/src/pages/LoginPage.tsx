/**client/src/pages/LoginPage.tsx */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../services/auth.api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const result = await loginApi(email, password, "sin_recaptcha");
      login(result.token, result.usuario);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        (err.code === "ECONNABORTED" ? "Tiempo de espera agotado, revisa tu conexión" : null) ||
        (!err.response ? "No se pudo conectar al servidor" : null) ||
        "Credenciales inválidas";
      setError(msg);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient Background Glows */}
      <div className="absolute top-[-15%] left-[20%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[15%] w-[500px] h-[500px] bg-slate-950/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo + Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-6
                          bg-gradient-to-br from-zinc-900 to-black rounded-2xl
                          shadow-[0_0_40px_-10px] shadow-indigo-950/50 border border-white/10">
            <span className="text-white text-2xl font-bold tracking-tighter">Z</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Zincel</h1>
          <p className="text-zinc-500 text-sm mt-2">CRM Premium</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.035] border border-white/[0.08] rounded-3xl p-10
                        shadow-2xl shadow-black/80 backdrop-blur-2xl">

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white">Bienvenido de nuevo</h2>
            <p className="text-zinc-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 tracking-wider">
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.1] 
                           rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none 
                           focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 tracking-wider">
                CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-5 py-4 pr-12 bg-white/[0.05] border border-white/[0.1]
                             rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none
                             focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  tabIndex={-1}
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 
                         hover:from-indigo-500 hover:to-indigo-400
                         text-white font-semibold rounded-2xl text-sm tracking-wider
                         shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {cargando ? "Verificando acceso..." : "INICIAR SESIÓN"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-10">
          © {new Date().getFullYear()} Zincel CRM • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}