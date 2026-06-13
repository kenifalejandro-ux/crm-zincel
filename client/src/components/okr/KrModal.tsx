/** client/src/components/okr/KrModal.tsx */

import { MODAL_BASE, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import {
  X, Trophy, DollarSign, ClipboardList,
  TrendingUp, Users, CalendarDays, Target,
} from "lucide-react";
import type { KeyResult, TipoMetricaOkr } from "../../types/okr.types";

interface Props {
  kr?: KeyResult | null;
  onClose: () => void;
  onSave: (payload: {
    titulo: string;
    tipo_metrica: TipoMetricaOkr;
    valor_objetivo: number;
    valor_actual?: number;
  }) => Promise<void>;
}

const METRICAS: {
  tipo: TipoMetricaOkr;
  label: string;
  descripcion: string;
  unidad: string;
  placeholder: string;
  icon: React.ReactNode;
  color: string;
  esResultado: boolean;
}[] = [
  {
    tipo: "nuevos_clientes",
    label: "Nuevos clientes",
    descripcion: "Prospectos con propuesta cerrada y ganada",
    unidad: "clientes", placeholder: "Ej: 5",
    icon: <Trophy size={14} />, color: "text-amber-500",
    esResultado: true,
  },
  {
    tipo: "ingresos_facturados",
    label: "Ingresos facturados",
    descripcion: "Suma total facturada en soles (S/)",
    unidad: "S/", placeholder: "Ej: 15000",
    icon: <DollarSign size={14} />, color: "text-emerald-500",
    esResultado: true,
  },
  {
    tipo: "tasa_cierre",
    label: "Tasa de cierre",
    descripcion: "% de propuestas que terminan en contrato",
    unidad: "%", placeholder: "Ej: 25",
    icon: <TrendingUp size={14} />, color: "text-violet-500",
    esResultado: true,
  },
  {
    tipo: "prospectos_calificados",
    label: "Prospectos calificados",
    descripcion: "Leads con interés confirmado en el trimestre",
    unidad: "leads", placeholder: "Ej: 50",
    icon: <Users size={14} />, color: "text-sky-500",
    esResultado: false,
  },
  {
    tipo: "propuestas_enviadas",
    label: "Propuestas enviadas",
    descripcion: "Propuestas creadas durante el trimestre",
    unidad: "propuestas", placeholder: "Ej: 20",
    icon: <ClipboardList size={14} />, color: "text-blue-500",
    esResultado: false,
  },
  {
    tipo: "reuniones_realizadas",
    label: "Reuniones realizadas",
    descripcion: "Reuniones con estado «realizada» en el trimestre",
    unidad: "reuniones", placeholder: "Ej: 30",
    icon: <CalendarDays size={14} />, color: "text-rose-500",
    esResultado: false,
  },
  {
    tipo: "manual",
    label: "Meta libre",
    descripcion: "Tú ingresas el progreso manualmente (NPS, satisfacción, etc.)",
    unidad: "", placeholder: "Ej: 80",
    icon: <Target size={14} />, color: "text-zinc-500",
    esResultado: false,
  },
];

export function KrModal({ kr, onClose, onSave }: Props) {
  const [titulo,      setTitulo]      = useState(kr?.titulo ?? "");
  const [tipoMetrica, setTipoMetrica] = useState<TipoMetricaOkr>(kr?.tipo_metrica ?? "nuevos_clientes");
  const [objetivo,    setObjetivo]    = useState(kr ? String(kr.valor_objetivo) : "");
  const [actual,      setActual]      = useState(kr ? String(kr.valor_actual) : "0");
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState("");

  const metricaActual = METRICAS.find(m => m.tipo === tipoMetrica)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio"); return; }
    const obj = parseFloat(objetivo);
    if (isNaN(obj) || obj <= 0) { setError("El objetivo debe ser mayor a 0"); return; }
    setError("");
    setGuardando(true);
    try {
      await onSave({
        titulo: titulo.trim(),
        tipo_metrica: tipoMetrica,
        valor_objetivo: obj,
        valor_actual: tipoMetrica === "manual" ? (parseFloat(actual) || 0) : undefined,
      });
      onClose();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const resultados  = METRICAS.filter(m => m.esResultado);
  const actividades = METRICAS.filter(m => !m.esResultado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`${MODAL_BASE} w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-zinc-100">
            {kr ? "Editar Key Result" : "Nuevo Key Result"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-300 transition">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Selector de métrica */}
          <div>
            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider mb-2">
              Resultados de negocio
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {resultados.map(m => (
                <button
                  key={m.tipo}
                  onClick={() => setTipoMetrica(m.tipo)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    tipoMetrica === m.tipo
                      ? "border-brand bg-amber-50"
                      : "border-white/10 hover:border-white/15"
                  }`}
                >
                  <span className={m.color}>{m.icon}</span>
                  <p className={`text-[11px] font-semibold leading-tight ${tipoMetrica === m.tipo ? "text-brand" : "text-zinc-300"}`}>
                    {m.label}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider mb-2">
              Actividades (indicadores de avance)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {actividades.map(m => (
                <button
                  key={m.tipo}
                  onClick={() => setTipoMetrica(m.tipo)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                    tipoMetrica === m.tipo
                      ? "border-brand bg-amber-50"
                      : "border-white/10 hover:border-white/15"
                  }`}
                >
                  <span className={m.color}>{m.icon}</span>
                  <p className={`text-[10px] font-semibold leading-tight ${tipoMetrica === m.tipo ? "text-brand" : "text-zinc-300"}`}>
                    {m.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción de la métrica seleccionada */}
          <p className={`${PANEL_BASE} text-[11px] text-zinc-400 px-3 py-2 leading-snug`}>
            {tipoMetrica !== "manual"
              ? `Progreso automático desde CRM · ${metricaActual.descripcion}`
              : metricaActual.descripcion}
          </p>

          {/* Título */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Descripción del KR</label>
            <input
              autoFocus
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder={`Ej: ${metricaActual.label} — ${metricaActual.placeholder} ${metricaActual.unidad}`}
              className={`${INPUT_BASE} mt-1 w-full px-3 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30`}
            />
          </div>

          {/* Objetivo + Actual (solo manual) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">
                Objetivo{metricaActual.unidad ? ` (${metricaActual.unidad})` : ""}
              </label>
              <input
                type="number" min={0}
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                placeholder={metricaActual.placeholder}
                className={`${INPUT_BASE} mt-1 w-full px-3 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30`}
              />
            </div>

            {tipoMetrica === "manual" && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Valor actual</label>
                <input
                  type="number" min={0}
                  value={actual}
                  onChange={e => setActual(e.target.value)}
                  placeholder="0"
                  className={`${INPUT_BASE} mt-1 w-full px-3 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30`}
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={guardando}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand/90 transition disabled:opacity-60"
          >
            {guardando ? "Guardando…" : kr ? "Guardar cambios" : "Añadir KR"}
          </button>
        </div>
      </div>
    </div>
  );
}
