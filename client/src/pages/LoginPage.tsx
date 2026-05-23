/** client/src/pages/LoginPage.tsx */

import { useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Target,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";

import { useAuth } from "../context/AuthContext";
import { loginApi } from "../services/auth.api";

import type { UsuarioPayload } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// 3D GRAPH
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedBarProps {
  x: number;
  targetH: number;
  color: string;
  delay: number;
}

function AnimatedBar({
  x,
  targetH,
  color,
  delay,
}: AnimatedBarProps) {
  const mesh = useRef<any>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;

    const raw = Math.max(0, (elapsed.current - delay) / 1.25);
    const progress = Math.min(raw, 1);

    // easing suave
    const eased = 1 - Math.pow(1 - progress, 3);

    const height = Math.max(targetH * eased, 0.001);

    if (mesh.current) {
      mesh.current.scale.y = height;
      mesh.current.position.y = height / 2;
    }
  });

  return (
    <mesh
      ref={mesh}
      position={[x, 0, 0]}
      scale={[0.82, 0.001, 0.82]}
    >
      <boxGeometry args={[0.7, 1, 0.7]} />
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        metalness={0.55}
      />
    </mesh>
  );
}

const BARS = [
  { x: -2.4, targetH: 0.9, color: "#ffffff", delay: 0.0 },
  { x: -1.2, targetH: 1.35, color: "#a19d9d", delay: 0.3 },
  { x: 0, targetH: 1.15, color: "#000000", delay: 0.3 },
  { x: 1.2, targetH: 2.15, color: "#07d4f8", delay: 0.45 },
  { x: 2.4, targetH: 3.1, color: "#f1da06", delay: 0.6 },
];

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#f1da06", 5, 12]} />

      <ambientLight intensity={0.35} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        color="#ffffff"
      />

      <pointLight
        position={[-3, 4, 3]}
        intensity={0.9}
        color="#ceab11"
      />

      <pointLight
        position={[3, 2, 4]}
        intensity={0.4}
        color="#f5e8b0"
      />

      {/* Piso */}
      <mesh
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#08080d" roughness={1} />
      </mesh>

      {/* Barras */}
      {BARS.map((bar, i) => (
        <AnimatedBar key={i} {...bar} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();

  const sessionMsg = sessionStorage.getItem("crm_session_msg");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [transicion, setTransicion] = useState(false);

  const [pendingData, setPendingData] = useState<{
    token: string;
    usuario: UsuarioPayload;
  } | null>(null);

  const currentYear = useMemo(
    () => new Date().getFullYear(),
    []
  );

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    sessionStorage.removeItem("crm_session_msg");

    setError(null);
    setCargando(true);

    try {
      const result = await loginApi(
        email,
        password,
        "sin_recaptcha"
      );

      setPendingData({
        token: result.token,
        usuario: result.usuario,
      });

      setTransicion(true);

      setTimeout(() => {
        login(result.token, result.usuario);
      }, 1800);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        (err?.code === "ECONNABORTED"
          ? "Tiempo de espera agotado. Revisa tu conexión."
          : null) ||
        (!err?.response
          ? "No se pudo conectar con el servidor."
          : null) ||
        "Credenciales inválidas";

      setError(message);
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT PANEL */}
      {/* ───────────────────────────────────────────────────────────── */}

      <div className="relative w-full lg:w-[42%] bg-zinc-100 flex items-center justify-center px-7 py-10 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(206,171,17,0.08),transparent_30%)]" />

        <div className="absolute -top-28 -left-28 w-[340px] h-[340px] rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {/* LOGO */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ceab11] to-[#f4cf34] flex items-center justify-center shadow-[0_0_40px_-5px_rgba(206,171,17,0.45)] mb-6">
              <span className="text-white text-xl font-black tracking-tight">
                Z
              </span>
            </div>

            <h1 className="text-[2rem] font-bold tracking-tight text-zinc-900">
              Zincel CRM
            </h1>

            <p className="text-sm text-zinc-700 mt-2 leading-relaxed">
              Gestiona clientes, campañas y ventas desde una
              sola plataforma moderna.
            </p>
          </motion.div>

          {/* SESSION MESSAGE */}
          <AnimatePresence>
            {sessionMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={16}
                    className="text-amber-500 mt-0.5"
                  />

                  <p className="text-xs text-amber-700 leading-relaxed">
                    {sessionMsg}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {/* EMAIL */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-zinc-700 mb-2">
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="tu@email.com"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full h-[52px] px-4 rounded-2xl
                  bg-white border border-zinc-200
                  text-sm text-zinc-800
                  placeholder:text-zinc-600
                  shadow-sm
                  focus:outline-none
                  focus:ring-4 focus:ring-amber-500/10
                  focus:border-amber-500/50
                  transition-all duration-200
                "
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-zinc-700 mb-2">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={verPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full h-[52px] px-4 pr-12 rounded-2xl
                    bg-white border border-zinc-200
                    text-sm text-zinc-800
                    placeholder:text-zinc-600
                    shadow-sm
                    focus:outline-none
                    focus:ring-4 focus:ring-amber-500/10
                    focus:border-amber-500/50
                    transition-all duration-200
                  "
                />

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() =>
                    setVerPassword((prev) => !prev)
                  }
                  className="
                    absolute right-4 top-1/2 -translate-y-1/2
                    text-zinc-600 hover:text-zinc-700
                    transition-colors
                  "
                >
                  {verPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="login-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="
                    rounded-2xl border border-red-500/20
                    bg-red-500/10 px-4 py-3
                  "
                >
                  <p className="text-xs text-red-500">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BUTTON */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={cargando}
              className="
                relative w-full h-[54px]
                rounded-2xl
                bg-[#ceab11]
                hover:bg-[#b8960d]
                text-white font-semibold text-sm
                shadow-[0_20px_50px_-15px_rgba(206,171,17,0.6)]
                overflow-hidden
                disabled:opacity-60
                disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {cargando && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              <span className="relative flex items-center justify-center gap-2">
                {cargando
                  ? "Verificando acceso..."
                  : "Iniciar sesión"}

                {!cargando && <ArrowRight size={16} />}
              </span>
            </motion.button>
          </motion.form>

          {/* FOOTER */}
          <div className="mt-10 pt-6 border-t border-zinc-200">
            <p className="text-xs text-zinc-700 text-center">
              © {currentYear} Zincel CRM · Plataforma de
              gestión comercial
            </p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL */}
      {/* ───────────────────────────────────────────────────────────── */}

      <div className="hidden lg:flex relative w-[58%] bg-[#050507] overflow-hidden items-center justify-center px-16">
        {/* GRID */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(243, 247, 6, 0.08) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        {/* GLOW */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full " />

        <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-2xl">
          {/* BADGE */}
          <motion.div
            className="
              inline-flex items-center gap-2
              px-4 py-2 rounded-full
              border border-white/10
              bg-white/[0.04]
              backdrop-blur-sm
              mb-8
            "
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />

            <span className="text-[11px] tracking-[0.22em] font-semibold text-amber-100 uppercase">
              CRM Inteligente
            </span>
          </motion.div>

          {/* TITLE */}
          <motion.h2
            className="
              text-[3.2rem]
              leading-[1.05]
              font-black
              tracking-tight
              text-white
              max-w-2xl
            "
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Convierte leads en{" "}
            <span className="text-amber-400">
              oportunidades reales.
            </span>
          </motion.h2>

          <motion.p
            className="
              mt-5
              text-zinc-600
              text-base
              leading-relaxed
              max-w-xl
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Automatiza seguimientos, controla campañas y
            analiza métricas comerciales en tiempo real.
          </motion.p>

          {/* CHART */}
          <motion.div
            className="
              mt-10 rounded-[28px]
              border border-white/10
              bg-white/[0.03]
              overflow-hidden
              backdrop-blur-sm
            "
            style={{ height: 290 }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Canvas
              camera={{
                position: [0, 3, 6.2],
                fov: 42,
              }}
            >
              <Scene />
            </Canvas>
          </motion.div>

          {/* MONTHS */}
          <div className="flex justify-between px-6 mt-3">
            {["Ene", "Feb", "Mar", "Abr", "May"].map(
              (month) => (
                <span
                  key={month}
                  className="text-[11px] text-zinc-600 font-medium"
                >
                  {month}
                </span>
              )
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              {
                Icon: TrendingUp,
                value: "+3.2x",
                label: "Conversiones",
                color: "text-amber-400",
              },
              {
                Icon: Users,
                value: "+67%",
                label: "Nuevos leads",
                color: "text-amber-300",
              },
              {
                Icon: Target,
                value: "+2.8x",
                label: "ROI campañas",
                color: "text-amber-400",
              },
            ].map(
              (
                { Icon, value, label, color },
                index
              ) => (
                <motion.div
                  key={index}
                  className="
                    rounded-2xl
                    border border-white/10
                    bg-black
                    px-5 py-4
                    backdrop-blur-sm
                  "
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1 + index * 0.12,
                  }}
                >
                  <Icon
                    size={16}
                    className={`${color} mb-3`}
                  />

                  <p
                    className={`text-2xl font-bold ${color}`}
                  >
                    {value}
                  </p>

                  <p className="text-[11px] text-zinc-700 mt-1">
                    {label}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TRANSITION */}
      {/* ───────────────────────────────────────────────────────────── */}

      <AnimatePresence>
        {transicion && (
          <motion.div
            className="
              fixed inset-0 z-50
              bg-zinc-950
              flex flex-col items-center justify-center
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="
                w-20 h-20 rounded-3xl
                bg-gradient-to-br
                from-amber-500
                to-yellow-400
                flex items-center justify-center
                shadow-[0_0_80px_-10px_rgba(206,171,17,0.65)]
              "
              initial={{
                scale: 0.5,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 16,
              }}
            >
              <motion.span
                className="text-white text-4xl font-black"
                animate={{
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                Z
              </motion.span>
            </motion.div>

            <motion.h3
              className="mt-7 text-white text-xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Bienvenido a Zincel CRM
            </motion.h3>

            <motion.p
              className="text-zinc-700 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              Hola, {pendingData?.usuario.nombre}
            </motion.p>

            <motion.div
              className="
                absolute bottom-0 left-0
                h-[3px]
                bg-gradient-to-r
                from-transparent
                via-amber-500
                to-transparent
              "
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 1.7,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  primary: "#ceab11",
  primaryHover: "#b8960d",

  primarySoft: "#f5e7a3",

  dark: "#18181b",

  muted: "#a1a1aa",
  mutedDark: "#71717a",
  mutedLight: "#d4d4d8",

  surface: "#f4f4f5",

  success: "#4ade80",
  danger: "#f87171",
  info: "#60a5fa",
} as const;