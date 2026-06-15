/** client/src/components/dashboard/PropuestasMesChart.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ClipboardList } from "lucide-react";
import { getPropuestasPorMes } from "../../services/propuestas.api";
import type { PropuestaMes } from "../../services/propuestas.api";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const COLORES = {
  enviadas:       "#f59e0b",
  en_negociacion: "#f97316",
  ganadas:        "#22c55e",
  perdidas:       "#ef4444",
};

interface Props {
  anio?: number;
}

export function PropuestasMesChart({ anio }: Props) {
  const [data,     setData]     = useState<PropuestaMes[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getPropuestasPorMes(anio)
      .then(setData)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [anio]);

  // Construir los 12 meses siempre (con 0 donde no hay datos)
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.mes_num === i + 1);
    return {
      mes:           MESES[i],
      Enviadas:      found?.enviadas       ?? 0,
      Negociación:   found?.en_negociacion ?? 0,
      Ganadas:       found?.ganadas        ?? 0,
      Perdidas:      found?.perdidas       ?? 0,
      total:         found?.total          ?? 0,
    };
  });

  // Totales anuales
  const totales = data.reduce(
    (acc, d) => ({
      total:         acc.total         + d.total,
      enviadas:      acc.enviadas      + d.enviadas,
      en_negociacion: acc.en_negociacion + d.en_negociacion,
      ganadas:       acc.ganadas       + d.ganadas,
      perdidas:      acc.perdidas      + d.perdidas,
    }),
    { total: 0, enviadas: 0, en_negociacion: 0, ganadas: 0, perdidas: 0 }
  );
  const activas = totales.enviadas + totales.en_negociacion;

  if (cargando) return (
    <div className={`${GLASS_BASE} p-5 h-48 flex items-center justify-center`}>
      <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className={`${GLASS_BASE} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)]`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-cyan-400" />
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Propuestas por mes {anio ? `· ${anio}` : ""}
          </p>
        </div>
        {/* Resumen */}
        <div className="flex items-center gap-4">
          {[
            { label: "Total",       value: totales.total,  cls: "text-zinc-200" },
            { label: "Ganadas",     value: totales.ganadas,  cls: "text-emerald-400" },
            { label: "Perdidas",    value: totales.perdidas, cls: "text-red-400" },
            { label: "Activas",     value: activas,          cls: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-base font-bold leading-none ${s.cls}`}>{s.value}</p>
              <p className="text-[9px] text-zinc-400 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={14} barGap={2}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend
            iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
          />
          <Bar filter="url(#neon-glow)" dataKey="Enviadas"    stackId="a" fill={COLORES.enviadas}       radius={[0,0,0,0]} />
          <Bar filter="url(#neon-glow)" dataKey="Negociación" stackId="a" fill={COLORES.en_negociacion} radius={[0,0,0,0]} />
          <Bar filter="url(#neon-glow)" dataKey="Ganadas"     stackId="a" fill={COLORES.ganadas}        radius={[0,0,0,0]} />
          <Bar filter="url(#neon-glow)" dataKey="Perdidas"    stackId="a" fill={COLORES.perdidas}       radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Detalle mes a mes */}
      {totales.total > 0 && (
        <div className="mt-3 border-t border-white/[0.05] pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {chartData.filter(d => d.total > 0).map(d => (
              <span key={d.mes} className="text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-300">{d.mes}</span>: {d.total}
                {d.Ganadas > 0 && <span className="text-emerald-400 ml-1">({d.Ganadas}✓)</span>}
                {d.Perdidas > 0 && <span className="text-red-400 ml-1">({d.Perdidas}✗)</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
