/** client/src/components/dashboard/ObjetivoDiarioGauge.tsx — PREMIUM NEON
 * Antes: react-d3-speedometer con textColor "#18181b" / needleColor "#18181b" (negro =
 * invisible sobre fondo oscuro) → se veía plano/apagado. Ahora: gauges SVG custom con
 * arco de progreso + glow, aguja de color y valor central legible. Sin react-d3-speedometer.
 * Lógica (carga de objetivos, meta editable en localStorage) INTACTA.
 */

import { GLASS_BASE, INPUT_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import { Phone, CalendarDays, FileText, Target, ClipboardList, Pencil, Check, X } from "lucide-react";
import { getObjetivos } from "../../services/inteligencia.api";
import type { ObjetivosDiarios } from "../../services/inteligencia.api";

const META_PROPUESTAS_KEY = "dashboard_meta_propuestas";

/** Color por progreso (rojo → verde) */
function progColor(ratio: number): string {
  if (ratio >= 1)    return "#34d399";
  if (ratio >= 0.66) return "#84cc16";
  if (ratio >= 0.4)  return "#fbbf24";
  if (ratio >= 0.2)  return "#fb923c";
  return "#f87171";
}

function Gauge({ real, meta, label, icon }: {
  real:  number;
  meta:  number;
  label: string;
  icon:  React.ReactNode;
}) {
  const ratio    = meta > 0 ? real / meta : 0;
  const pct      = Math.min(ratio, 1);
  const cumplido = real >= meta;
  const col      = progColor(ratio);

  const R = 52, cx = 70, cy = 70;
  const C = Math.PI * R;            // longitud del semicírculo
  const dash = pct * C;
  const ang  = Math.PI - pct * Math.PI;   // 180°(izq) → 0°(der)
  const nx = cx + (R - 6) * Math.cos(ang);
  const ny = cy - (R - 6) * Math.sin(ang);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 92 }}>
        <svg viewBox="0 0 140 84" className="w-full">
          {/* track */}
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" strokeLinecap="round" />
          {/* progress */}
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none" stroke={col} strokeWidth="11" strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ filter: `drop-shadow(0 0 5px ${col})`, transition: "stroke-dasharray 0.8s ease" }} />
          {/* needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={col} strokeWidth="2.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${col})` }} />
          <circle cx={cx} cy={cy} r="4" fill="#0a1120" stroke={col} strokeWidth="1.5" />
        </svg>
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ bottom: 8 }}>
          <span className="font-display text-lg font-bold tabular-nums leading-none" style={{ color: col, textShadow: `0 0 10px ${col}66` }}>
            {real}<span className="text-zinc-600 text-sm">/{meta}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold mt-1" style={{ color: cumplido ? "#34d399" : "#a1a1aa" }}>
        {icon} {label}
      </div>
      <p className="text-[11px] font-bold mt-1" style={{ color: cumplido ? "#34d399" : col }}>
        {cumplido ? "✓ Meta alcanzada" : `Restante: ${meta - real}`}
      </p>
    </div>
  );
}

const LABEL_PERIODO: Record<string, string> = {
  hoy:    "Objetivos de hoy",
  semana: "Objetivos de la semana",
  mes:    "Objetivos del mes",
  anio:   "Objetivos del año",
  dia:    "Objetivos del día",
};

interface ObjetivoDiarioGaugeProps {
  filtroPeriodo?:    string;
  mesSeleccionado?:  { mes: number; anio: number };
  anioSeleccionado?: number;
  diaSeleccionado?:  string;
  propuestasHoy?:    number;
}

export function ObjetivoDiarioGauge({
  filtroPeriodo,
  mesSeleccionado,
  anioSeleccionado,
  diaSeleccionado,
  propuestasHoy = 0,
}: ObjetivoDiarioGaugeProps) {
  const [obj, setObj] = useState<ObjetivosDiarios | null>(null);
  const [metaPropuestas, setMetaPropuestas] = useState<number>(() => {
    const s = localStorage.getItem(META_PROPUESTAS_KEY);
    return s ? parseInt(s, 10) : 5;
  });
  const [editando, setEditando] = useState(false);
  const [input,    setInput]    = useState(String(metaPropuestas));

  const guardarMeta = () => {
    const v = parseInt(input, 10);
    if (v > 0) { setMetaPropuestas(v); localStorage.setItem(META_PROPUESTAS_KEY, String(v)); }
    setEditando(false);
  };

  function buildParams(): Record<string, unknown> {
    if (filtroPeriodo === "mes" && mesSeleccionado)
      return { periodo: "mes", mes: mesSeleccionado.mes + 1, anio: mesSeleccionado.anio };
    if (filtroPeriodo === "anio" || !filtroPeriodo)
      return { periodo: "anio", anio: anioSeleccionado ?? new Date().getFullYear() };
    if (filtroPeriodo === "dia")
      return { periodo: "dia", fecha: diaSeleccionado };
    return { periodo: filtroPeriodo };
  }

  useEffect(() => {
    const params = buildParams();
    getObjetivos(params as any).then(setObj).catch(console.error);
  }, [filtroPeriodo, mesSeleccionado, anioSeleccionado, diaSeleccionado]);

  if (!obj) return null;

  const label = LABEL_PERIODO[filtroPeriodo ?? "mes"] ?? "Objetivos del mes";

  return (
    <div className={`${GLASS_BASE} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Target size={14} className="text-accent" />
        <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{label}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
        <Gauge real={obj.llamadas_hoy}  meta={obj.llamadas_meta}  label="Llamadas"  icon={<Phone size={12} />} />
        <Gauge real={obj.reuniones_hoy} meta={obj.reuniones_meta} label="Reuniones" icon={<CalendarDays size={12} />} />
        <Gauge real={obj.brochures_hoy} meta={obj.brochures_meta} label="Brochures" icon={<FileText size={12} />} />
        <div className="flex flex-col items-center">
          <Gauge real={propuestasHoy} meta={metaPropuestas} label="Propuestas" icon={<ClipboardList size={12} />} />
          {!editando ? (
            <button
              onClick={() => { setInput(String(metaPropuestas)); setEditando(true); }}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-accent transition mt-1"
            >
              <Pencil size={9} /> Meta: {metaPropuestas}/mes
            </button>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number" min={1} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") guardarMeta(); if (e.key === "Escape") setEditando(false); }}
                className={`${INPUT_BASE} w-12 text-[11px] px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent/40 text-center`}
                autoFocus
              />
              <button onClick={() => setEditando(false)}><X size={11} className="text-zinc-400" /></button>
              <button onClick={guardarMeta}><Check size={11} className="text-accent" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}