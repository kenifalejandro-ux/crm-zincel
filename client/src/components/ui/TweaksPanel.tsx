/** client/src/components/ui/TweaksPanel.tsx
 *
 *  Panel flotante de personalización en vivo.
 *  Controla las variables CSS globales del tema neon:
 *    --accent  (color de acento, triplete RGB)
 *    --glow    (intensidad del glow: 0–2)
 *    --font-display (tipografía de títulos/números)
 *
 *  Cómo funciona: cada control llama setProperty() en :root. Como todo el
 *  sistema neon (neon.css / tokens.ts) lee de esas variables, TODO el CRM
 *  se repinta al instante. La selección se guarda en localStorage.
 *
 *  Uso (una sola vez, en el layout — p. ej. lLayout.tsx):
 *    import { TweaksPanel } from "../ui/TweaksPanel";
 *    <TweaksPanel />   // junto a <NeonFilters />
 *
 *  Para ocultarlo en producción: <TweaksPanel enabled={import.meta.env.DEV} />
 */
import { useEffect, useState } from "react";
import { Palette, X, Sparkles, Type as TypeIcon, Sun } from "lucide-react";

/* ── Opciones ─────────────────────────────────────────────────────────────── */
const COLORES = [
  { nombre: "Cyan",      hex: "#06b6d4", rgb: "6 182 212" },
  { nombre: "Violeta",   hex: "#a855f7", rgb: "168 85 247" },
  { nombre: "Rosa",      hex: "#ec4899", rgb: "236 72 153" },
  { nombre: "Esmeralda", hex: "#34d399", rgb: "52 211 153" },
  { nombre: "Ámbar",     hex: "#f59e0b", rgb: "245 158 11" },
  { nombre: "Azul",      hex: "#3b82f6", rgb: "59 130 246" },
];

const FUENTES = [
  { nombre: "Space Grotesk", valor: "'Space Grotesk', sans-serif" },
  { nombre: "Sora",          valor: "'Sora', sans-serif" },
  { nombre: "Outfit",        valor: "'Outfit', sans-serif" },
  { nombre: "Inter",         valor: "'Inter', sans-serif" },
];

const LS_KEY = "crm_tweaks";

interface Tweaks {
  accent: string;   // triplete RGB
  glow: number;     // 0–2
  font: string;     // font-family
}

const DEFAULTS: Tweaks = {
  accent: "6 182 212",
  glow: 1,
  font: "'Space Grotesk', sans-serif",
};

function leer(): Tweaks {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

function aplicar(t: Tweaks) {
  const r = document.documentElement;
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--glow", String(t.glow));
  r.style.setProperty("--font-display", t.font);
}

export function TweaksPanel({ enabled = true }: { enabled?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [t, setT] = useState<Tweaks>(DEFAULTS);

  // Cargar al montar
  useEffect(() => {
    const inicial = leer();
    setT(inicial);
    aplicar(inicial);
  }, []);

  // Persistir + aplicar en cada cambio
  const set = (parcial: Partial<Tweaks>) => {
    setT((prev) => {
      const next = { ...prev, ...parcial };
      aplicar(next);
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const reset = () => set(DEFAULTS);

  if (!enabled) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-5 right-5 z-[200] w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{
          background: "rgb(var(--accent))",
          color: "#04101a",
          boxShadow: "0 0 22px rgb(var(--accent) / calc(0.6 * var(--glow))), 0 8px 24px rgba(0,0,0,0.5)",
        }}
        title="Personalizar tema"
      >
        {abierto ? <X size={18} /> : <Palette size={18} />}
      </button>

      {/* Panel */}
      {abierto && (
        <div
          className="fixed bottom-20 right-5 z-[200] w-[300px] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(17,25,43,0.96), rgba(9,14,28,0.98))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgb(var(--accent) / 0.4)",
            borderRadius: "1.25rem",
            boxShadow:
              "0 0 0 1px rgb(var(--accent) / 0.1), 0 0 40px rgb(var(--accent) / calc(0.3 * var(--glow))), 0 20px 50px rgba(0,0,0,0.6)",
            animation: "tw-up 0.25s cubic-bezier(0.2,0.7,0.3,1) both",
          }}
        >
          <style>{`@keyframes tw-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "rgb(var(--accent))" }} />
              <p className="font-display text-[14px] font-bold text-zinc-100">Personalizar</p>
            </div>
            <button onClick={reset} className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-200 transition uppercase tracking-wider">
              Reset
            </button>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Color de acento */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Palette size={12} className="text-zinc-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Color de acento</p>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {COLORES.map((c) => {
                  const activo = t.accent === c.rgb;
                  return (
                    <button
                      key={c.rgb}
                      onClick={() => set({ accent: c.rgb })}
                      title={c.nombre}
                      className="aspect-square rounded-lg transition-all"
                      style={{
                        background: c.hex,
                        boxShadow: activo
                          ? `0 0 0 2px #0a101f, 0 0 0 4px ${c.hex}, 0 0 12px ${c.hex}`
                          : `0 0 8px ${c.hex}66`,
                        transform: activo ? "scale(1.08)" : "scale(1)",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Glow */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sun size={12} className="text-zinc-500" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Intensidad del glow</p>
                </div>
                <span className="font-display text-[12px] font-bold tabular-nums" style={{ color: "rgb(var(--accent))" }}>
                  {t.glow.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={t.glow}
                onChange={(e) => set({ glow: parseFloat(e.target.value) })}
                className="tw-range w-full"
              />
              <style>{`
                .tw-range{-webkit-appearance:none;appearance:none;height:5px;border-radius:999px;
                  background:linear-gradient(90deg, rgb(var(--accent)) ${(t.glow/2)*100}%, rgba(255,255,255,0.1) ${(t.glow/2)*100}%);outline:none}
                .tw-range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;
                  background:rgb(var(--accent));cursor:pointer;box-shadow:0 0 10px rgb(var(--accent) / calc(0.7*var(--glow)))}
                .tw-range::-moz-range-thumb{width:16px;height:16px;border:none;border-radius:50%;
                  background:rgb(var(--accent));cursor:pointer;box-shadow:0 0 10px rgb(var(--accent))}
              `}</style>
            </div>

            {/* Tipografía */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <TypeIcon size={12} className="text-zinc-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Tipografía</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FUENTES.map((f) => {
                  const activo = t.font === f.valor;
                  return (
                    <button
                      key={f.valor}
                      onClick={() => set({ font: f.valor })}
                      className="py-2 rounded-lg text-[13px] font-bold transition-all border"
                      style={{
                        fontFamily: f.valor,
                        color: activo ? "rgb(var(--accent))" : "#a1a1aa",
                        background: activo ? "rgb(var(--accent) / 0.12)" : "rgba(255,255,255,0.03)",
                        borderColor: activo ? "rgb(var(--accent) / 0.4)" : "rgba(255,255,255,0.07)",
                      }}
                    >
                      {f.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/[0.08]">
            <p className="text-[10.5px] text-zinc-600 leading-relaxed">
              Los cambios se aplican a todo el CRM y se guardan en este navegador.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
