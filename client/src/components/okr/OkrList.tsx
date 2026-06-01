/** client/src/components/okr/OkrList.tsx */

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
          <Target size={14} className="text-brand" />
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            OKRs Corporativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            className="p-1.5 text-zinc-400 hover:text-brand transition rounded-lg hover:bg-zinc-100"
            title="Actualizar"
          >
            <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setNuevoOkr(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition"
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                anioFiltro === a
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-zinc-200" />

        {/* Trimestre */}
        <div className="flex gap-1">
          {TRIMESTRES.map(t => (
            <button
              key={t.q}
              onClick={() => setQFiltro(t.q)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                qFiltro === t.q
                  ? "bg-amber-50 text-brand border border-brand/30"
                  : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
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
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {resumen.encamino} en camino
            </span>
          )}
          {resumen.riesgo > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {resumen.riesgo} en riesgo
            </span>
          )}
          {resumen.critico > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {resumen.critico} crítico{resumen.critico > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* OKR cards */}
      {cargando ? (
        <div className={`${CARD_CLASS} flex items-center justify-center py-8`}>
          <RefreshCw size={18} className="animate-spin text-zinc-300" />
        </div>
      ) : okrsFiltrados.length === 0 ? (
        <div className={`${CARD_CLASS} text-center py-10`}>
          <Target size={28} className="mx-auto text-zinc-200 mb-3" />
          <p className="text-sm font-medium text-zinc-400">No hay objetivos para este período</p>
          <p className="text-xs text-zinc-300 mt-1">
            Crea tu primer OKR para comenzar a medir el progreso corporativo
          </p>
          <button
            onClick={() => setNuevoOkr(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition"
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
