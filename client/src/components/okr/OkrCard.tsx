/** client/src/components/okr/OkrCard.tsx */

import { useState } from "react";
import {
  Trophy, DollarSign, ClipboardList, TrendingUp,
  Users, CalendarDays, Target,
  Pencil, Trash2, Plus, ChevronDown, ChevronUp, Check, X,
} from "lucide-react";
import type { Okr, KeyResult, TipoMetricaOkr } from "../../types/okr.types";
import { KrModal } from "./KrModal";
import { OkrModal } from "./OkrModal";
import {
  deleteOkr, updateOkr,
  addKeyResult, updateKeyResult, deleteKeyResult,
} from "../../services/okr.api";

// ─── Configuración de métricas ─────────────────────────────────────────────────
const METRICA: Record<TipoMetricaOkr, {
  label: string; unidad: string; sufijo: string;
  icon: React.ReactNode; color: string; esResultado: boolean;
}> = {
  nuevos_clientes:       { label: "Nuevos clientes",       unidad: "",    sufijo: " clientes",  icon: <Trophy size={12} />,       color: "text-amber-500",  esResultado: true  },
  ingresos_facturados:   { label: "Ingresos facturados",   unidad: "S/ ", sufijo: "",           icon: <DollarSign size={12} />,   color: "text-emerald-500",esResultado: true  },
  tasa_cierre:           { label: "Tasa de cierre",        unidad: "",    sufijo: "%",          icon: <TrendingUp size={12} />,   color: "text-violet-500", esResultado: true  },
  prospectos_calificados:{ label: "Prospectos calificados",unidad: "",    sufijo: " leads",     icon: <Users size={12} />,         color: "text-sky-500",    esResultado: false },
  propuestas_enviadas:   { label: "Propuestas enviadas",   unidad: "",    sufijo: " propuestas",icon: <ClipboardList size={12} />, color: "text-blue-500",   esResultado: false },
  reuniones_realizadas:  { label: "Reuniones realizadas",  unidad: "",    sufijo: " reuniones", icon: <CalendarDays size={12} />, color: "text-rose-500",   esResultado: false },
  manual:                { label: "Meta libre",            unidad: "",    sufijo: "",           icon: <Target size={12} />,       color: "text-zinc-500",   esResultado: false },
};

const Q_LABEL: Record<number, string> = {
  1: "Q1 · Ene–Mar", 2: "Q2 · Abr–Jun",
  3: "Q3 · Jul–Sep", 4: "Q4 · Oct–Dic",
};

function formatValor(valor: number, tipo: TipoMetricaOkr) {
  const cfg = METRICA[tipo];
  if (tipo === "ingresos_facturados") {
    const k = valor >= 1000 ? `${(valor / 1000).toFixed(1)}k` : valor.toFixed(0);
    return `S/ ${k}`;
  }
  if (tipo === "tasa_cierre") return `${Math.round(valor)}%`;
  return `${Math.round(valor)}${cfg.sufijo}`;
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
function ProgressRing({ value }: { value: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const color = value >= 70 ? "#22c55e" : value >= 35 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#f4f4f5" strokeWidth="9" />
      <circle
        cx="42" cy="42" r={r} fill="none"
        stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 42 42)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="42" y="39" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{value}%</text>
      <text x="42" y="53" textAnchor="middle" fontSize="9" fill="#a1a1aa">logrado</text>
    </svg>
  );
}

// ─── KR Row ────────────────────────────────────────────────────────────────────
function KrRow({ kr, okrId, onRefresh }: { kr: KeyResult; okrId: string; onRefresh: () => void }) {
  const cfg       = METRICA[kr.tipo_metrica];
  const pct       = kr.progreso_pct ?? 0;
  const valorReal = kr.valor_real ?? kr.valor_actual;
  const barColor  = pct >= 70 ? "bg-emerald-400" : pct >= 35 ? "bg-amber-400" : "bg-red-400";

  const [editKr,      setEditKr]      = useState(false);
  const [editActual,  setEditActual]  = useState(false);
  const [inputActual, setInputActual] = useState(String(kr.valor_actual));
  const [confirmDel,  setConfirmDel]  = useState(false);

  const guardarActual = async () => {
    const v = parseFloat(inputActual);
    if (!isNaN(v) && v >= 0) await updateKeyResult(okrId, kr.id, { valor_actual: v });
    setEditActual(false);
    onRefresh();
  };

  return (
    <>
      <div className="group flex items-center gap-3 py-2.5 border-b border-zinc-50 last:border-0">
        <span className={`shrink-0 ${cfg.color}`}>{cfg.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-zinc-700 truncate">{kr.titulo}</p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button onClick={() => setEditKr(true)} className="p-0.5 text-zinc-400 hover:text-brand transition">
                <Pencil size={11} />
              </button>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} className="p-0.5 text-zinc-400 hover:text-red-500 transition">
                  <Trash2 size={11} />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={async () => { await deleteKeyResult(okrId, kr.id); onRefresh(); }} className="p-0.5 text-red-500"><Check size={11} /></button>
                  <button onClick={() => setConfirmDel(false)} className="p-0.5 text-zinc-400"><X size={11} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-zinc-500 shrink-0">
              {formatValor(valorReal, kr.tipo_metrica)} / {formatValor(kr.valor_objetivo, kr.tipo_metrica)}
            </span>
            <span className={`text-[10px] font-bold shrink-0 w-7 text-right ${
              pct >= 70 ? "text-emerald-500" : pct >= 35 ? "text-amber-500" : "text-red-500"
            }`}>{pct}%</span>
          </div>

          {kr.tipo_metrica === "manual" && (
            <div className="mt-1">
              {!editActual ? (
                <button
                  onClick={() => { setInputActual(String(kr.valor_actual)); setEditActual(true); }}
                  className="text-[10px] text-zinc-400 hover:text-brand transition flex items-center gap-0.5"
                >
                  <Pencil size={9} /> Actualizar progreso
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={0} value={inputActual}
                    onChange={e => setInputActual(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") guardarActual(); if (e.key === "Escape") setEditActual(false); }}
                    className="w-16 text-[11px] px-1.5 py-0.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 text-center"
                    autoFocus
                  />
                  <button onClick={() => setEditActual(false)}><X size={11} className="text-zinc-400" /></button>
                  <button onClick={guardarActual}><Check size={11} className="text-brand" /></button>
                </div>
              )}
            </div>
          )}

          {kr.tipo_metrica !== "manual" && (
            <p className="text-[9px] text-zinc-300 mt-0.5">Actualizado automáticamente desde CRM</p>
          )}
        </div>
      </div>

      {editKr && (
        <KrModal
          kr={kr}
          onClose={() => setEditKr(false)}
          onSave={async (payload) => {
            await updateKeyResult(okrId, kr.id, {
              titulo: payload.titulo,
              valor_objetivo: payload.valor_objetivo,
              valor_actual: payload.valor_actual,
            });
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// ─── OkrCard ───────────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  encamino: { label: "En camino",  bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  riesgo:   { label: "En riesgo",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  critico:  { label: "Crítico",    bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
};

interface Props { okr: Okr; onRefresh: () => void }

export function OkrCard({ okr, onRefresh }: Props) {
  const [expandido,  setExpandido]  = useState(true);
  const [editOkr,    setEditOkr]    = useState(false);
  const [addKr,      setAddKr]      = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const estado = ESTADO_CFG[okr.estado];

  const krResultados  = okr.key_results.filter(kr => METRICA[kr.tipo_metrica].esResultado);
  const krActividades = okr.key_results.filter(kr => !METRICA[kr.tipo_metrica].esResultado);

  return (
    <>
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)] p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <ProgressRing value={okr.progreso_total} />

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${estado.bg} ${estado.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                    {estado.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {Q_LABEL[okr.trimestre]} {okr.anio}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 leading-snug">{okr.titulo}</h3>
                {okr.descripcion && (
                  <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{okr.descripcion}</p>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setExpandido(v => !v)} className="p-1.5 text-zinc-400 hover:text-zinc-700 transition rounded-lg hover:bg-zinc-50">
                  {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => setEditOkr(true)} className="p-1.5 text-zinc-400 hover:text-brand transition rounded-lg hover:bg-zinc-50">
                  <Pencil size={13} />
                </button>
                {!confirmDel ? (
                  <button onClick={() => setConfirmDel(true)} className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded-lg hover:bg-zinc-50">
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-red-600 font-medium">¿Eliminar?</span>
                    <button onClick={async () => { await deleteOkr(okr.id); onRefresh(); }} className="text-red-500 hover:text-red-700"><Check size={12} /></button>
                    <button onClick={() => setConfirmDel(false)} className="text-zinc-400 hover:text-zinc-700"><X size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KRs expandidos */}
        {expandido && (
          <div className="mt-4">
            {okr.key_results.length === 0 ? (
              <p className="text-xs text-zinc-300 italic">Sin Key Results — añade uno para medir el progreso</p>
            ) : (
              <>
                {krResultados.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Resultados
                    </p>
                    <div className="border-t border-zinc-50">
                      {krResultados.map(kr => (
                        <KrRow key={kr.id} kr={kr} okrId={okr.id} onRefresh={onRefresh} />
                      ))}
                    </div>
                  </div>
                )}
                {krActividades.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Actividades
                    </p>
                    <div className="border-t border-zinc-50">
                      {krActividades.map(kr => (
                        <KrRow key={kr.id} kr={kr} okrId={okr.id} onRefresh={onRefresh} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setAddKr(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-brand transition font-medium"
            >
              <Plus size={13} /> Añadir Key Result
            </button>
          </div>
        )}
      </div>

      {editOkr && (
        <OkrModal
          okr={okr}
          onClose={() => setEditOkr(false)}
          onSave={async (payload) => { await updateOkr(okr.id, payload); onRefresh(); }}
        />
      )}

      {addKr && (
        <KrModal
          onClose={() => setAddKr(false)}
          onSave={async (payload) => { await addKeyResult(okr.id, payload); onRefresh(); }}
        />
      )}
    </>
  );
}
