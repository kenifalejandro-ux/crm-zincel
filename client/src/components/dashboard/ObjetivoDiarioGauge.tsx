/** client/src/components/dashboard/ObjetivoDiarioGauge.tsx */

import { useEffect, useState } from "react";
import ReactSpeedometer, { Transition } from "react-d3-speedometer";
import { Phone, CalendarDays, FileText, Target, ClipboardList, Pencil, Check, X } from "lucide-react";
import { getObjetivos } from "../../services/inteligencia.api";
import type { ObjetivosDiarios } from "../../services/inteligencia.api";

const META_PROPUESTAS_KEY = "dashboard_meta_propuestas";

function Gauge({ real, meta, label, icon }: {
  real:  number;
  meta:  number;
  label: string;
  icon:  React.ReactNode;
}) {
  const value    = Math.min(real, meta);
  const cumplido = real >= meta;
  const pct      = meta > 0 ? real / meta : 0;

  return (
    <div className="flex flex-col items-center">
      <ReactSpeedometer
        width={200}
        height={130}
        minValue={0}
        maxValue={meta}
        value={value}
        needleColor="#18181b"
        startColor="#ef4444"
        endColor="#22c55e"
        segments={5}
        segmentColors={["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e"]}
        needleTransitionDuration={800}
        needleTransition={Transition.easeBounceOut}
        currentValueText={`${real} / ${meta}`}
        textColor="#18181b"
        valueTextFontSize="13px"
        labelFontSize="10px"
        ringWidth={20}
        paddingHorizontal={6}
        paddingVertical={6}
      />
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 -mt-2">
        <span className={cumplido ? "text-emerald-500" : "text-zinc-400"}>{icon}</span>
        {label}
      </div>
      <p className={`text-xs font-bold mt-1 ${
        cumplido       ? "text-emerald-500"
        : pct >= 0.55  ? "text-emerald-400"
        : pct >= 0.35  ? "text-amber-500"
        : "text-red-500"
      }`}>
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

// ─── Componente principal ─────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-1">
        <Target size={14} className="text-brand" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 justify-items-center">
        <Gauge real={obj.llamadas_hoy}  meta={obj.llamadas_meta}  label="Llamadas"  icon={<Phone size={12}/>} />
        <Gauge real={obj.reuniones_hoy} meta={obj.reuniones_meta} label="Reuniones" icon={<CalendarDays size={12}/>} />
        <Gauge real={obj.brochures_hoy} meta={obj.brochures_meta} label="Brochures" icon={<FileText size={12}/>} />
        <div className="flex flex-col items-center">
          <Gauge real={propuestasHoy} meta={metaPropuestas} label="Propuestas" icon={<ClipboardList size={12}/>} />
          {!editando ? (
            <button
              onClick={() => { setInput(String(metaPropuestas)); setEditando(true); }}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-brand transition mt-0.5"
            >
              <Pencil size={9} /> Meta: {metaPropuestas}/mes
            </button>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="number" min={1} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") guardarMeta(); if (e.key === "Escape") setEditando(false); }}
                className="w-12 text-[11px] px-1.5 py-0.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 text-center"
                autoFocus
              />
              <button onClick={() => setEditando(false)}><X size={11} className="text-zinc-400" /></button>
              <button onClick={guardarMeta}><Check size={11} className="text-brand" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
