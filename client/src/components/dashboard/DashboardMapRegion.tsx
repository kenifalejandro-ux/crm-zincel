/** client/src/components/dashboard/DashboardMapRegion.tsx */

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { PeruMap, normalizeRegion } from "../ui/PeruMap";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import type { RegionEtapa } from "../../services/prospectos.api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function ActividadRegion({ selected }: { selected: RegionEtapa }) {
  const barData = [
    { nombre: "Llamadas",   valor: selected.llamadas   ?? 0, color: COLORS.dark      },
    { nombre: "Brochures",  valor: selected.brochures  ?? 0, color: COLORS.mutedDark },
    { nombre: "Reuniones",  valor: selected.reuniones  ?? 0, color: COLORS.muted     },
    { nombre: "Propuestas", valor: selected.propuestas ?? 0, color: COLORS.primary   },
  ];
  return (
    <div className="mt-5 pt-4 border-t border-white/8">
      <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider mb-3">
        Actividad en <span className="capitalize">{selected.zona.replace(/_/g, " ")}</span>
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
            formatter={(val: any) => [val, ""]}
          />
          <Bar filter="url(#neon-glow)" dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={52}>
            {barData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function colorPorVolumen(total: number, maxTotal: number): string {
  if (total === 0) return "#f4f4f5";
  const r = total / maxTotal;
  if (r >= 0.6)  return COLORS.dark;
  if (r >= 0.3)  return COLORS.mutedDark;
  if (r >= 0.1)  return "#71717a";
  if (r >= 0.02) return "#a1a1aa";
  return "#d4d4d8";
}

interface Props {
  datos: RegionEtapa[];
}

export function DashboardMapRegion({ datos }: Props) {
  const [selected, setSelected] = useState<RegionEtapa | null>(null);

  const datosValidos = datos.filter(d => d.zona && d.zona !== "Sin región");
  const totalGeneral = datos.reduce((s, d) => s + d.total, 0);
  const maxTotal     = Math.max(...datosValidos.map(d => d.total), 1);

  const dataMap = new Map(datosValidos.map(d => [normalizeRegion(d.zona), d]));

  function handleSelect(normName: string) {
    const d = dataMap.get(normName);
    if (!d) return;
    setSelected(prev => prev?.zona === d.zona ? null : d);
  }

  const tasaContacto = (d: RegionEtapa) =>
    d.llamadas > 0 ? Math.round((d.llamadas_contestadas / d.llamadas) * 100) : 0;

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <MapPin size={12} className="mr-1.5 text-rose-500" />
        Actividad por región
      </h2>

      <div className="flex flex-col lg:flex-row gap-4 mt-3">

        {/* Mapa */}
        <div className="flex-1 min-w-0 h-[360px] sm:h-[440px] lg:h-[500px] overflow-hidden rounded-xl">
          <PeruMap
            getColor={norm => {
              const d = dataMap.get(norm);
              return d ? colorPorVolumen(d.total, maxTotal) : "#f4f4f5";
            }}
            markers={datosValidos.map(d => ({
              zona:  normalizeRegion(d.zona),
              value: d.total,
            }))}
            selected={selected ? normalizeRegion(selected.zona) : undefined}
            selectColor={COLORS.primary}
            onSelect={handleSelect}
            height="100%"
            bgColor="#f8fafc"
          />
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-52 shrink-0 flex flex-col gap-3">

          {selected ? (
            <div className="border border-white/10 rounded-xl p-3 space-y-3">
              {/* Cabecera */}
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-zinc-200 capitalize">
                  {selected.zona.replace(/_/g, " ")}
                </p>
                <button onClick={() => setSelected(null)}>
                  <X size={13} className="text-zinc-400 hover:text-zinc-300" />
                </button>
              </div>

              {/* KPIs de empresas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-800/40 rounded-lg px-2.5 py-2">
                  <p className="text-[9px] text-zinc-100 uppercase">Empresas</p>
                  <p className="text-[20px] font-bold text-zinc-200">{selected.total}</p>
                </div>
                <div className="bg-zinc-800/40 rounded-lg px-2.5 py-2">
                  <p className="text-[9px] text-zinc-100 uppercase">% del total</p>
                  <p className="text-[20px] font-bold text-brand">
                    {totalGeneral > 0 ? Math.round((selected.total / totalGeneral) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Barra vs mayor región */}
              <div className="border-t border-white/8 pt-2">
                <p className="text-[9px] text-zinc-400 mb-1">Vs mayor región</p>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-zinc-800 transition-all duration-500"
                    style={{ width: `${Math.round((selected.total / maxTotal) * 100)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl flex items-center justify-center h-36">
              <p className="text-[10px] text-zinc-400 text-center px-3 leading-relaxed">
                Clic en un<br />departamento<br />para ver la actividad
              </p>
            </div>
          )}

          {/* Top regiones */}
          <div className="border border-white/8 rounded-xl p-3">
            <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-wider mb-2">Top regiones</p>
            <div className="space-y-1">
              {datosValidos.slice(0, 6).map((d, i) => (
                <div key={d.zona}
                  className={`flex items-center gap-2 px-1.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    selected?.zona === d.zona ? "bg-zinc-800" : "hover:bg-zinc-800/40"
                  }`}
                  onClick={() => handleSelect(normalizeRegion(d.zona))}
                >
                  <span className="text-[9px] text-zinc-400 w-3 shrink-0">{i + 1}</span>
                  <span className="text-[10px] text-zinc-300 flex-1 truncate capitalize">
                    {d.zona.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-200">{d.total}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Gráfico de actividad al pie del mapa ── */}
      {selected && <ActividadRegion selected={selected} />}

    </div>
  );
}
