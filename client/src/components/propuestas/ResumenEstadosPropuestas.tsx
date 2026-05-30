/** client/src/components/propuestas/ResumenEstadosPropuestas.tsx */

import { useEffect, useState } from "react";
import { ClipboardList, TrendingUp, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { getResumenEstadosPropuestas, getKanbanOportunidades } from "../../services/propuestas.api";
import type { ResumenEstadoPropuesta, OportunidadKanban } from "../../services/propuestas.api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DrilldownModal } from "../inteligencia/DrilldownModal";
import type { LeadDrilldown } from "../inteligencia/DrilldownModal";

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}

const ESTADOS = [
  { key: "enviada",        label: "Enviadas",    color: COLORS.primary,  bg: "bg-yellow-50",  border: "border-yellow-200", icon: <Clock size={16} className="text-yellow-500" />        },
  { key: "en_negociacion", label: "Negociación", color: "#a1a1aa",       bg: "bg-zinc-50",    border: "border-zinc-200",   icon: <TrendingUp size={16} className="text-zinc-500" />      },
  { key: "cerrada_ganada", label: "Ganadas",     color: "#16a34a",       bg: "bg-green-50",   border: "border-green-200",  icon: <CheckCircle2 size={16} className="text-green-600" />   },
  { key: "cerrada_perdida",label: "Perdidas",    color: "#ef4444",       bg: "bg-red-50",     border: "border-red-200",    icon: <XCircle size={16} className="text-red-500" />           },
  { key: "vencida",        label: "Vencidas",    color: "#d4d4d8",       bg: "bg-zinc-50",    border: "border-zinc-200",   icon: <AlertCircle size={16} className="text-zinc-400" />      },
];

interface Props {
  filtroPeriodo?:    string;
  mesSeleccionado?:  { mes: number; anio: number };
  diaSeleccionado?:  string;
}

export function ResumenEstadosPropuestas({ filtroPeriodo, mesSeleccionado, diaSeleccionado }: Props) {
  const [data,    setData]    = useState<ResumenEstadoPropuesta[]>([]);
  const [kanban,  setKanban]  = useState<Record<string, OportunidadKanban[]>>({});
  const [drill,   setDrill]   = useState<{ estado: string; label: string } | null>(null);

  useEffect(() => {
    const params: { periodo?: string; mes?: number; anio?: number; fecha?: string } = {};
    if (filtroPeriodo) params.periodo = filtroPeriodo;
    if (filtroPeriodo === "mes" && mesSeleccionado) {
      params.mes  = mesSeleccionado.mes + 1;
      params.anio = mesSeleccionado.anio;
    }
    if (filtroPeriodo === "dia" && diaSeleccionado) params.fecha = diaSeleccionado;

    getResumenEstadosPropuestas(params).then(setData).catch(() => {});
    getKanbanOportunidades().then(({ porEstado }) => setKanban(porEstado)).catch(() => {});
  }, [filtroPeriodo, mesSeleccionado, diaSeleccionado]);

  const total = data.reduce((s, d) => s + d.total, 0);

  const chartData = ESTADOS.map(e => {
    const item = data.find(d => d.estado === e.key);
    return { ...e, total: item?.total ?? 0, monto: item?.monto_total ?? 0 };
  }).filter(d => d.total > 0);

  const montoTotal = data.reduce((s, d) => s + d.monto_total, 0);
  const ganadas    = data.find(d => d.estado === "cerrada_ganada")?.total ?? 0;
  const activas    = (data.find(d => d.estado === "enviada")?.total ?? 0) + (data.find(d => d.estado === "en_negociacion")?.total ?? 0);
  const conversion = (ganadas + (data.find(d => d.estado === "cerrada_perdida")?.total ?? 0)) > 0
    ? Math.round(ganadas / (ganadas + (data.find(d => d.estado === "cerrada_perdida")?.total ?? 0)) * 100)
    : 0;

  function getDrillLeads(estado: string): LeadDrilldown[] {
    const ops = kanban[estado] ?? [];
    return ops.map(op => ({
      id:              op.prospecto_id,
      empresa:         op.empresa,
      nombre_contacto: op.nombre_contacto,
      telefono:        op.telefono,
      ciudad:          op.ciudad,
      etapa_pipeline:  undefined,
      extra:           op.monto_propuesto > 0 ? fmt(op.moneda === "USD" ? op.monto_propuesto * op.tipo_cambio : op.monto_propuesto) : undefined,
    }));
  }

  return (
    <div className={CARD_CLASS}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={14} className="text-amber-500 shrink-0" strokeWidth={2} />
        <div>
          <h3 className={HEADER_CLASS}>Estado de propuestas</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">{total} propuestas · clic para ver empresas</p>
        </div>
      </div>

      {total === 0 && (
        <p className="text-xs text-zinc-400 text-center py-6">Sin propuestas en el período seleccionado</p>
      )}

      {/* KPIs + Donut */}
      {total > 0 && <div className="flex items-center gap-4 mb-5">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} dataKey="total" stroke="none" paddingAngle={2}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
                formatter={(val: any, _: any, props: any) => [`${val} prop.`, props.payload.label]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-zinc-900">{total}</span>
            <span className="text-[9px] text-zinc-400">total</span>
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-zinc-500 uppercase">Ganadas</p>
            <p className="text-xl font-bold text-green-600">{ganadas}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-zinc-500 uppercase">Activas</p>
            <p className="text-xl font-bold text-yellow-600">{activas}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-zinc-500 uppercase">Conversión</p>
            <p className="text-xl font-bold text-zinc-800">{conversion}%</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-zinc-500 uppercase">Pipeline</p>
            <p className="text-sm font-bold text-zinc-800">{fmt(montoTotal)}</p>
          </div>
        </div>
      </div>}

      {/* Tiles clickeables por estado */}
      {total > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ESTADOS.map(e => {
          const item = data.find(d => d.estado === e.key);
          if (!item || item.total === 0) return null;
          const pct = Math.round((item.total / total) * 100);
          return (
            <button
              key={e.key}
              onClick={() => setDrill({ estado: e.key, label: e.label })}
              className={`flex items-center gap-3 rounded-xl border ${e.bg} ${e.border} p-3 text-left hover:shadow-sm transition group`}
            >
              <div className="shrink-0">{e.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800">{e.label}</p>
                <p className="text-[10px] text-zinc-500">{fmt(item.monto_total)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-800">{item.total}</p>
                <p className="text-[10px] text-zinc-400">{pct}%</p>
              </div>
            </button>
          );
        })}
      </div>}

      {/* Drill-down modal */}
      {drill && (
        <DrilldownModal
          titulo={drill.label}
          leads={getDrillLeads(drill.estado)}
          onCerrar={() => setDrill(null)}
        />
      )}
    </div>
  );
}
