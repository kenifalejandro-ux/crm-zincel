/** client/src/components/inteligencia/RankingSubcategorias.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { CARD_CLASS, BADGE_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { getAnalisisPipeline } from "../../services/propuestas.api";
import type { SubcategoriaAnalisis } from "../../services/propuestas.api";
import { LABEL_SERVICIO } from "../../types/propuesta.types";
import type { ServicioPropuesta } from "../../types/propuesta.types";

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}

function convRate(ganadas: number, perdidas: number): number | null {
  return (ganadas + perdidas) > 0
    ? Math.round(ganadas / (ganadas + perdidas) * 100)
    : null;
}

function lbl(s: string) {
  return LABEL_SERVICIO[s as ServicioPropuesta] ?? s;
}

// Colores distintos por servicio
const SERVICIO_COLOR: Record<string, string> = {
  desarrollo_web:     "#f59e0b",
  wordpress:          "#3b82f6",
  redes_sociales:     "#8b5cf6",
  "diseño_marketing": "#06b6d4",
  erp:                "#10b981",
  crm:                "#f97316",
  otro:               "#6b7280",
};

export function RankingSubcategorias() {
  const clr = useChartColors();
  const [datos,    setDatos]    = useState<SubcategoriaAnalisis[] | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAnalisisPipeline()
      .then(d => setDatos(d.por_subcategoria))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
      </div>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <div className={`${CARD_CLASS} flex flex-col items-center justify-center py-10 gap-2`}>
        <BarChart2 size={28} className="text-zinc-200" />
        <p className="text-xs text-zinc-400">Sin datos de subcategorías aún.</p>
        <p className="text-[11px] text-zinc-400">Registra propuestas con paquete o plataforma seleccionada.</p>
      </div>
    );
  }

  const chartData = datos.map(r => ({
    name:  r.subcategoria,
    Total: r.total,
    color: SERVICIO_COLOR[r.servicio] ?? clr.accent,
  }));

  return (
    <div className={`${CARD_CLASS} space-y-5`}>

      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 size={14} className="text-brand shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Ranking por subcategoría</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Paquetes y plataformas más cotizados y su rendimiento</p>
        </div>
      </div>

      {/* Gráfico barras horizontales */}
      <div style={{ height: Math.max(160, datos.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#3f3f46" }} width={110} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              formatter={(v: any) => [`${v} propuesta${v !== 1 ? "s" : ""}`, "Total"]}
            />
            <Bar filter="url(#neon-glow)" dataKey="Total" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla detallada */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 px-3 text-zinc-100 font-medium">Servicio</th>
              <th className="text-left py-2 pr-2 text-zinc-100 font-medium">Categoría</th>
              <th className="text-center py-2 pr-2 text-zinc-100 font-medium">Total</th>
              <th className="text-center py-2 pr-2 text-zinc-100 font-medium">Activas</th>
              <th className="text-center py-2 pr-2 text-green-600 font-medium">Ganadas</th>
              <th className="text-center py-2 pr-2 text-red-500 font-medium">Perdidas</th>
              <th className="text-right py-2 pr-2 text-zinc-100 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Cierre %</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((r, i) => {
              const c = convRate(r.ganadas, r.perdidas);
              return (
                <tr key={i} className="border-b border-white/5 hover:bg-zinc-800/40 transition">
                  <td className="py-2.5 px-3 text-zinc-500 text-[11px]">{lbl(r.servicio)}</td>
                  <td className="py-2.5 pr-2">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                      style={{ backgroundColor: SERVICIO_COLOR[r.servicio] ?? clr.accent }}
                    >
                      {r.subcategoria}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-center font-semibold text-zinc-200">{r.total}</td>
                  <td className="py-2.5 pr-2 text-center text-zinc-400">{r.activas}</td>
                  <td className="py-2.5 pr-2 text-center font-semibold text-green-700">{r.ganadas}</td>
                  <td className="py-2.5 pr-2 text-center text-red-500">{r.perdidas}</td>
                  <td className="py-2.5 pr-2 text-right text-zinc-300">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {c !== null
                      ? <span className={`${BADGE_BASE} text-[10px] font-bold px-1.5 py-0.5 ${ c >= 60 ? "bg-green-100 text-green-700" : c >= 30 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-500" }`}>{c}%</span>
                      : <span className="text-[10px] text-zinc-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
