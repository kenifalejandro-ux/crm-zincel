/** client/src/pages/LoginPage.tsx */

import { useState, useRef }        from "react";
import { Eye, EyeOff, TrendingUp, Users, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame }        from "@react-three/fiber";
import { useAuth }                 from "../context/AuthContext";
import { loginApi }                from "../services/auth.api";
import type { UsuarioPayload }     from "../context/AuthContext";

// ── 3D: barra individual animada ──────────────────────────────────────────────
function AnimatedBar({ x, targetH, color, delay }: {
  x: number; targetH: number; color: string; delay: number;
}) {
  const mesh    = useRef<any>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const raw    = Math.max(0, (elapsed.current - delay) / 1.3);
    const t      = Math.min(raw, 1);
    const eased  = 1 - Math.pow(1 - t, 3);
    const h      = Math.max(targetH * eased, 0.001);
    if (mesh.current) {
      mesh.current.scale.y    = h;
      mesh.current.position.y = h / 2;
    }
  });

  return (
    <mesh ref={mesh} position={[x, 0, 0]} scale={[1, 0.001, 1]}>
      <boxGeometry args={[0.55, 1, 0.55]} />
      <meshStandardMaterial color={color} roughness={0.15} metalness={0.55} />
    </mesh>
  );
}

const BARS = [
  { x: -2,   targetH: 0.8,  color: "#3730a3", delay: 0.0  },
  { x: -1,   targetH: 1.25, color: "#4338ca", delay: 0.15 },
  { x:  0,   targetH: 1.05, color: "#4f46e5", delay: 0.3  },
  { x:  1,   targetH: 2.0,  color: "#6366f1", delay: 0.45 },
  { x:  2,   targetH: 2.8,  color: "#818cf8", delay: 0.6  },
];

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]}  intensity={1.3}  color="#ffffff" />
      <pointLight      position={[-3, 5, 3]}  intensity={0.7}  color="#6366f1" />
      <pointLight      position={[ 3, 2, 4]}  intensity={0.35} color="#a5b4fc" />
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color="#06060f" roughness={1} />
      </mesh>
      {BARS.map((b, i) => <AnimatedBar key={i} {...b} />)}
    </>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();

  const sessionMsg = sessionStorage.getItem("crm_session_msg");

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [cargando,    setCargando]    = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [transicion,  setTransicion]  = useState(false);
  const [pendingData, setPendingData] = useState<{ token: string; usuario: UsuarioPayload } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const result = await loginApi(email, password, "sin_recaptcha");
      setPendingData({ token: result.token, usuario: result.usuario });
      setTransicion(true);
      setTimeout(() => login(result.token, result.usuario), 1900);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        (err.code === "ECONNABORTED" ? "Tiempo de espera agotado, revisa tu conexión" : null) ||
        (!err.response ? "No se pudo conectar al servidor" : null) ||
        "Credenciales inválidas";
      setError(msg);
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Izquierda: Formulario ──────────────────────────────────────────── */}
      <div className="w-full lg:w-7xl bg-zinc-950 flex items-center justify-center px-8 py-12 relative overflow-hidden">

        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-amber-600/[0.06] rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="w-full max-w-sm relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="mb-10">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-500
                          flex items-center justify-center mb-6 rounded-lg
                          shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <span className="text-white text-lg font-bold tracking-tighter">Z</span>
            </motion.div>
            <motion.h1
              className="text-2xl font-semibold text-white tracking-tight"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              Zincel CRM
            </motion.h1>
            <motion.p
              className="text-zinc-500 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38, duration: 0.4 }}
            >
              Inicia sesión en tu cuenta
            </motion.p>
          </div>

          {/* Mensaje de sesión expirada */}
          {sessionMsg && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs px-4 py-3 rounded-lg">
              {sessionMsg}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5"
            onSubmitCapture={() => sessionStorage.removeItem("crm_session_msg")}>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-widest uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg
                           text-white text-sm placeholder:text-zinc-600
                           focus:outline-none focus:border-amber-500/60 focus:ring-1
                           focus:ring-amber-500/30 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-widest uppercase">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-zinc-900 border border-zinc-800 rounded-lg
                             text-white text-sm placeholder:text-zinc-600
                             focus:outline-none focus:border-amber-500/60 focus:ring-1
                             focus:ring-amber-500/30 transition-all duration-200"
                />
                <button type="button" onClick={() => setVerPassword(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition">
                  {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 mt-1 bg-amber-600 hover:bg-amber-500
                         text-white font-semibold text-sm rounded-lg
                         shadow-lg shadow-amber-600/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 relative overflow-hidden"
            >
              {cargando && (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative">{cargando ? "Verificando..." : "Iniciar sesión"}</span>
            </button>
          </form>

          <p className="text-center text-zinc-700 text-xs mt-10">
            © {new Date().getFullYear()} Zincel · Todos los derechos reservados
          </p>
        </motion.div>
      </div>

      {/* ── Derecha: Panel 3D ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[58%] bg-[#06060f] relative overflow-hidden flex-col items-center justify-center px-14">

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">

          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-[11px] font-medium tracking-widest">CRM INTELIGENTE</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            className="text-[2.6rem] font-bold text-white leading-tight tracking-tight mb-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Convierte leads.<br />
            <span className="text-amber-400">Escala tu agencia.</span>
          </motion.h2>

          <motion.p
            className="text-zinc-500 text-sm mb-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            Centraliza campañas, métricas y clientes en una sola plataforma.
          </motion.p>

          {/* 3D Chart */}
          <motion.div
            className="w-full rounded-2xl overflow-hidden border border-white/[0.05] bg-black/25"
            style={{ height: "230px" }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Canvas camera={{ position: [0, 2.8, 6.2], fov: 44 }}>
              <Scene />
            </Canvas>
          </motion.div>

          {/* Labels meses */}
          <motion.div
            className="flex justify-between px-5 mt-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            {["Ene", "Feb", "Mar", "Abr", "May"].map(m => (
              <span key={m} className="text-[10px] text-zinc-700 font-medium">{m}</span>
            ))}
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: TrendingUp, label: "Conversiones", value: "+3.2x", color: "text-amber-400"  },
              { Icon: Users,      label: "Leads",        value: "+67%",  color: "text-violet-400" },
              { Icon: Target,     label: "ROI campañas", value: "+2.8x", color: "text-blue-400"   },
            ].map(({ Icon, label, value, color }, i) => (
              <motion.div
                key={i}
                className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1, duration: 0.4 }}
              >
                <Icon size={13} className={`${color} mb-2`} />
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-zinc-600 text-[10px] mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transición al CRM ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {transicion && (
          <motion.div
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-500
                          flex items-center justify-center rounded-xl
                          shadow-[0_0_70px_-5px_rgba(99,102,241,0.7)]"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.55, type: "spring", stiffness: 170, damping: 14 }}
            >
              <motion.span
                className="text-white text-3xl font-bold tracking-tighter"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ delay: 0.8, duration: 0.7, repeat: 1 }}
              >
                Z
              </motion.span>
            </motion.div>

            <motion.p
              className="text-white text-base font-semibold mt-5 tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              Zincel CRM
            </motion.p>
            <motion.p
              className="text-zinc-500 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              Bienvenido, {pendingData?.usuario.nombre}
            </motion.p>

            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-amber-600 via-violet-500 to-amber-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.2, duration: 1.65, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
