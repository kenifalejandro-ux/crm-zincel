/** client/src/components/dashboard/VentasGanadasCharts.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Building2, Briefcase, Tag } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { getAnalisisPipeline } from "../../services/propuestas.api";
import type { AnalisisPipelineData } from "../../services/propuestas.api";
import { LABEL_SERVICIO } from "../../types/propuesta.types";
import type { ServicioPropuesta } from "../../types/propuesta.types";

const SERVICIO_COLOR: Record<string, string> = {
  desarrollo_web:     "#f59e0b",
  wordpress:          "#3b82f6",
  redes_sociales:     "#8b5cf6",
  "diseño_marketing": "#06b6d4",
  erp:                "#10b981",
  crm:                "#f97316",
  otro:               "#6b7280",
};

function SubChart({
  icon, titulo, data, emptyMsg,
}: {
  icon: React.ReactNode;
  titulo: string;
  data: { name: string; Ganadas: number; Perdidas: number; color?: string }[];
  emptyMsg: string;
}) {
  const height = Math.max(120, data.length * 40 + 40);
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className={HEADER_CLASS}>{titulo}</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-8">{emptyMsg}</p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#a1a1aa" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#3f3f46" }} width={120} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
            <Bar dataKey="Ganadas"  fill="#22c55e" radius={[0, 3, 3, 0]} barSize={10} />
            <Bar dataKey="Perdidas" fill="#ef4444" radius={[0, 3, 3, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function VentasGanadasCharts() {
  const [data,     setData]     = useState<AnalisisPipelineData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAnalisisPipeline()
      .then(setData)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0,1,2].map(i => (
        <div key={i} className={`${CARD_CLASS} flex items-center justify-center`} style={{ minHeight: 180 }}>
          <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      ))}
    </div>
  );

  // Por empresa — top 8 con actividad
  const empresaData = (data?.por_empresa ?? [])
    .filter(e => (e.ganadas + e.perdidas) > 0)
    .slice(0, 8)
    .map(e => ({
      name:     e.empresa.length > 18 ? e.empresa.slice(0, 17) + "…" : e.empresa,
      Ganadas:  e.ganadas,
      Perdidas: e.perdidas,
    }));

  // Por servicio
  const servicioData = (data?.por_servicio ?? [])
    .filter(s => (s.ganadas + s.perdidas) > 0)
    .map(s => ({
      name:     LABEL_SERVICIO[s.servicio as ServicioPropuesta] ?? s.servicio,
      Ganadas:  s.ganadas,
      Perdidas: s.perdidas,
      color:    SERVICIO_COLOR[s.servicio] ?? COLORS.primary,
    }));

  // Por subcategoría
  const subcatData = (data?.por_subcategoria ?? [])
    .filter(s => (s.ganadas + s.perdidas) > 0)
    .slice(0, 8)
    .map(s => ({
      name:     s.subcategoria,
      Ganadas:  s.ganadas,
      Perdidas: s.perdidas,
    }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SubChart
        icon={<Building2 size={14} className="text-emerald-500 shrink-0" />}
        titulo="Ganadas vs Perdidas · Empresa"
        data={empresaData}
        emptyMsg="Sin cierres registrados"
      />
      <SubChart
        icon={<Briefcase size={14} className="text-brand shrink-0" />}
        titulo="Ganadas vs Perdidas · Servicio"
        data={servicioData}
        emptyMsg="Sin cierres registrados"
      />
      <SubChart
        icon={<Tag size={14} className="text-purple-500 shrink-0" />}
        titulo="Ganadas vs Perdidas · Categoría"
        data={subcatData}
        emptyMsg="Sin cierres con subcategoría"
      />
    </div>
  );
}
