/** client/src/components/okr/OkrList.tsx — REDISEÑO NEON
 * Antes: botones bg-brand, año activo bg-zinc-900, filtros bg-slate-800/60, Q activo
 * bg-amber-50, badges text-emerald-700/amber-700/red-700, empty Target text-zinc-200.
 * Ahora: todo neon (filtros con acento, badges translúcidos). Lógica INTACTA.
 */

import { useEffect, useState } from "react";
import { Plus, Target, RefreshCw } from "lucide-react";
import type { Okr } from "../../types/okr.types";
import { getOkrs, createOkr } from "../../services/okr.api";
import { OkrCard } from "./OkrCard";
import { OkrModal } from "./OkrModal";
import { CARD_CLASS } from "../../lib/tokens";

const anioActual = new Date().getFullYear();
const mesActual  = new Date().getMonth(); // 0-indexed
const trimestreActual = Math.floor(mesActual / 3) + 1;

const TRIMESTRES = [
  { q: 0, label: "Todos" },
  { q: 1, label: "Q1" },
  { q: 2, label: "Q2" },
  { q: 3, label: "Q3" },
  { q: 4, label: "Q4" },
];

const BTN_ON  = "bg-accent-15 text-accent border border-accent-30";
const BTN_OFF = "bg-white/[0.04] border border-white/10 text-zinc-500 hover:border-white/20";

export function OkrList() {
  const [okrs,         setOkrs]         = useState<Okr[]>([]);
  const [cargando,     setCargando]      = useState(true);
  const [nuevoOkr,     setNuevoOkr]     = useState(false);
  const [anioFiltro,   setAnioFiltro]   = useState(anioActual);
  const [qFiltro,      setQFiltro]      = useState(0);

  const cargar = async () => {
    setCargando(true);
    try {
      setOkrs(await getOkrs());
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aniosDisponibles = Array.from(
    new Set([anioActual - 1, anioActual, anioActual + 1, ...okrs.map(o => o.anio)])
  ).sort((a, b) => b - a);

  const okrsFiltrados = okrs.filter(o => {
    const matchAnio = o.anio === anioFiltro;
    const matchQ    = qFiltro === 0 || o.trimestre === qFiltro;
    return matchAnio && matchQ;
  });

  const resumen = {
    total:    okrsFiltrados.length,
    encamino: okrsFiltrados.filter(o => o.estado === "encamino").length,
    riesgo:   okrsFiltrados.filter(o => o.estado === "riesgo").length,
    critico:  okrsFiltrados.filter(o => o.estado === "critico").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-accent" />
          <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
            OKRs Corporativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            className="p-1.5 text-zinc-500 hover:text-accent transition rounded-lg hover:bg-white/[0.05]"
            title="Actualizar"
          >
            <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setNuevoOkr(true)}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          >
            <Plus size={13} />
            Nuevo objetivo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Año */}
        <div className="flex gap-1">
          {aniosDisponibles.map(a => (
            <button
              key={a}
              onClick={() => setAnioFiltro(a)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${anioFiltro === a ? BTN_ON : BTN_OFF}`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Trimestre */}
        <div className="flex gap-1">
          {TRIMESTRES.map(t => (
            <button
              key={t.q}
              onClick={() => setQFiltro(t.q)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${qFiltro === t.q ? BTN_ON : BTN_OFF}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen pills */}
      {okrsFiltrados.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-400">{resumen.total} objetivo{resumen.total !== 1 ? "s" : ""}</span>
          {resumen.encamino > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {resumen.encamino} en camino
            </span>
          )}
          {resumen.riesgo > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {resumen.riesgo} en riesgo
            </span>
          )}
          {resumen.critico > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-300 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {resumen.critico} crítico{resumen.critico > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* OKR cards */}
      {cargando ? (
        <div className={`${CARD_CLASS} flex items-center justify-center py-8`}>
          <RefreshCw size={18} className="animate-spin text-zinc-500" />
        </div>
      ) : okrsFiltrados.length === 0 ? (
        <div className={`${CARD_CLASS} text-center py-10`}>
          <Target size={28} className="mx-auto text-accent mb-3" />
          <p className="text-sm font-medium text-zinc-400">No hay objetivos para este período</p>
          <p className="text-xs text-zinc-500 mt-1">
            Crea tu primer OKR para comenzar a medir el progreso corporativo
          </p>
          <button
            onClick={() => setNuevoOkr(true)}
            className="btn-primary mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <Plus size={14} />
            Crear primer objetivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {okrsFiltrados.map(okr => (
            <OkrCard key={okr.id} okr={okr} onRefresh={cargar} />
          ))}
        </div>
      )}

      {nuevoOkr && (
        <OkrModal
          anioDefault={anioFiltro}
          trimestreDefault={qFiltro || trimestreActual}
          onClose={() => setNuevoOkr(false)}
          onSave={async (payload) => {
            await createOkr(payload);
            await cargar();
          }}
        />
      )}
    </div>
  );
}