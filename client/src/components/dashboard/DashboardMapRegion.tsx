/** client/src/components/dashboard/DashboardMapRegion.tsx — NEON
 * Antes: panel lateral con tema claro residual (bg-zinc-800/40, text-zinc-100 en labels,
 * text-brand, bg-brand, border-white/8, hover:bg-zinc-800/40) + heredaba los bordes y
 * marcadores BLANCOS de PeruMap (lo que lo hacía verse plano).
 * Ahora: panel neon (KPIs translúcidos, barra de acento con glow, top regiones con
 * mini-barra de color) + usa el PeruMap neon (bordes cian, marcadores con glow).
 * Lógica/datos/selección INTACTOS.
 *
 * REQUIERE el PeruMap.tsx neon (archivo aparte en bloque-analisis/components-ui).
 */

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { PeruMap, normalizeRegion } from "../ui/PeruMap";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import type { RegionEtapa } from "../../services/prospectos.api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function ActividadRegion({ selected }: { selected: RegionEtapa }) {
  const c = useChartColors();
  const barData = [
    { nombre: "Llamadas",   valor: selected.llamadas   ?? 0, color: c.palette[1] },
    { nombre: "Brochures",  valor: selected.brochures  ?? 0, color: c.palette[2] },
    { nombre: "Reuniones",  valor: selected.reuniones  ?? 0, color: c.palette[3] },
    { nombre: "Propuestas", valor: selected.propuestas ?? 0, color: c.accent     },
  ];
  return (
    <div className="mt-5 pt-4 border-t border-white/[0.08]">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
        Actividad en <span className="capitalize text-zinc-300">{selected.zona.replace(/_/g, " ")}</span>
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgb(var(--accent) / 0.35)", color: "#e4e4e7" }}
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

// Escala cyan sobre fondo oscuro (más actividad = cyan más brillante)
function colorPorVolumen(total: number, maxTotal: number): string {
  if (total === 0) return "#141d2e";   // sin datos (apagado)
  const r = total / maxTotal;
  if (r >= 0.6)  return "#22d3ee";      // cyan-400 (brillante)
  if (r >= 0.3)  return "#0891b2";      // cyan-600
  if (r >= 0.1)  return "#0e7490";      // cyan-700
  if (r >= 0.02) return "#155e75";      // cyan-800
  return "#1c4257";                     // cyan muy tenue
}

interface Props {
  datos: RegionEtapa[];
}

export function DashboardMapRegion({ datos }: Props) {
  const c = useChartColors();
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

  return (
    <div className={CARD_CLASS}>
      <h2 className={HEADER_CLASS}>
        <MapPin size={12} className="mr-1.5 text-rose-400" />
        Actividad por región
      </h2>

      <div className="flex flex-col lg:flex-row gap-4 mt-3">

        {/* Mapa */}
        <div className="flex-1 min-w-0 h-[360px] sm:h-[440px] lg:h-[500px] overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <PeruMap
            getColor={norm => {
              const d = dataMap.get(norm);
              return d ? colorPorVolumen(d.total, maxTotal) : "#141d2e";
            }}
            markers={datosValidos.map(d => ({
              zona:  normalizeRegion(d.zona),
              value: d.total,
            }))}
            selected={selected ? normalizeRegion(selected.zona) : undefined}
            selectColor={c.accent}
            onSelect={handleSelect}
            height="100%"
            bgColor="#0a1120"
          />
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-52 shrink-0 flex flex-col gap-3">

          {selected ? (
            <div className="rounded-xl p-3 space-y-3" style={{ border: "1px solid rgb(var(--accent) / 0.3)", background: "rgb(var(--accent) / 0.04)" }}>
              {/* Cabecera */}
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-zinc-100 capitalize">
                  {selected.zona.replace(/_/g, " ")}
                </p>
                <button onClick={() => setSelected(null)}>
                  <X size={13} className="text-zinc-500 hover:text-zinc-300" />
                </button>
              </div>

              {/* KPIs de empresas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-2.5 py-2" style={{ background: "rgb(var(--accent) / 0.06)", border: "1px solid rgb(var(--accent) / 0.2)" }}>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wide">Empresas</p>
                  <p className="font-display text-[20px] font-bold text-zinc-100">{selected.total}</p>
                </div>
                <div className="rounded-lg px-2.5 py-2" style={{ background: "rgb(var(--accent) / 0.06)", border: "1px solid rgb(var(--accent) / 0.2)" }}>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wide">% del total</p>
                  <p className="font-display text-[20px] font-bold text-accent" style={{ textShadow: "0 0 12px rgb(var(--accent) / calc(0.5*var(--glow)))" }}>
                    {totalGeneral > 0 ? Math.round((selected.total / totalGeneral) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Barra vs mayor región */}
              <div className="border-t border-white/[0.08] pt-2">
                <p className="text-[9px] text-zinc-500 mb-1">Vs mayor región</p>
                <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((selected.total / maxTotal) * 100)}%`, background: "rgb(var(--accent))", boxShadow: "0 0 8px rgb(var(--accent))" }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl flex items-center justify-center h-36">
              <p className="text-[10px] text-zinc-500 text-center px-3 leading-relaxed">
                Clic en un<br />departamento<br />para ver la actividad
              </p>
            </div>
          )}

          {/* Top regiones */}
          <div className="rounded-xl p-3" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Top regiones</p>
            <div className="space-y-0.5">
              {datosValidos.slice(0, 6).map((d, i) => {
                const act = selected?.zona === d.zona;
                const col = colorPorVolumen(d.total, maxTotal);
                return (
                  <div key={d.zona}
                    className={`flex items-center gap-2 px-1.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      act ? "bg-accent-10" : "hover:bg-white/[0.04]"
                    }`}
                    onClick={() => handleSelect(normalizeRegion(d.zona))}
                  >
                    <span className="text-[9px] font-bold w-3 shrink-0" style={{ color: act ? "rgb(var(--accent))" : "#52525b" }}>{i + 1}</span>
                    <span className="text-[10px] text-zinc-300 flex-1 truncate capitalize">
                      {d.zona.replace(/_/g, " ")}
                    </span>
                    <div className="w-10 h-1 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${(d.total / maxTotal) * 100}%`, background: col, boxShadow: `0 0 5px ${col}` }} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-200 w-6 text-right">{d.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Gráfico de actividad al pie del mapa ── */}
      {selected && <ActividadRegion selected={selected} />}

    </div>
  );
}