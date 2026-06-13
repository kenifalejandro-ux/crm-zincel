/** src/components/metricas/ProyectosTab.tsx */

import { GLASS_BASE } from "../../lib/tokens";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { TrendingUp, DollarSign, Users, Info } from "lucide-react";

interface ProyectoStats {
  proyecto:   string;
  campanas:   number;
  gasto:      number;
  leads:      number;
  clics:      number;
  ventas:     number;
  revenue:    number;
  roas_real:  number;
  cpl:        number | null;
  es_general: boolean;
}

const PROY_STYLE: Record<string, { bar: string; badge: string }> = {
  "Alborada":      { bar: "bg-violet-500",  badge: "bg-violet-100 text-violet-700 border-violet-200"   },
  "Terrenos Villa":{ bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "San Fernando":  { bar: "bg-sky-500",     badge: "bg-sky-100 text-sky-700 border-sky-200"             },
};
const generalStyle = { bar: "bg-zinc-300", badge: "bg-zinc-100 text-zinc-500 border-zinc-200" };

const fmt  = (n: number) => `S/ ${Number(n).toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;
const fmtK = (n: number) => n >= 1000 ? `S/ ${(n / 1000).toFixed(0)}k` : fmt(n);

interface Props { empresa?: string }

export function ProyectosTab({ empresa }: Props) {
  const [data,     setData]     = useState<ProyectoStats[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get("/metricas/por-proyecto", { params: empresa ? { empresa } : {} })
      .then(r => setData(r.data.data ?? []))
      .catch(() => setData([]))
      .finally(() => setCargando(false));
  }, [empresa]);

  if (cargando) return <div className="py-16 text-center text-zinc-400 text-sm">Cargando...</div>;
  if (data.length === 0) return (
    <div className="py-16 text-center text-zinc-400 text-sm">Sin campañas con proyectos asignados</div>
  );

  const dedicadas  = data.filter(d => !d.es_general);
  const general    = data.find(d => d.es_general);
  const maxGasto   = Math.max(...dedicadas.map(d => Number(d.gasto)), 1);
  const totalDedicado = dedicadas.reduce((s, d) => s + Number(d.gasto), 0);
  const totalRev      = dedicadas.reduce((s, d) => s + Number(d.revenue), 0);

  return (
    <div className="space-y-6">

      {/* Aviso metodología */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          El ROAS por proyecto se calcula <strong>solo con campañas dedicadas</strong> (asignadas a un único proyecto).
          Las campañas multi-proyecto se muestran aparte como <strong>Inversión General</strong> — su impacto es real pero no atribuible a un proyecto específico.
        </span>
      </div>

      {/* KPIs dedicadas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <DollarSign size={18} className="text-amber-500" />,  label: "Inversión dedicada",   valor: fmt(totalDedicado) },
          { icon: <TrendingUp  size={18} className="text-green-500" />, label: "Revenue atribuido",    valor: fmtK(totalRev)     },
          { icon: <DollarSign  size={18} className="text-zinc-400" />,  label: "Inversión general",
            valor: general ? fmt(Number(general.gasto)) : "S/ 0",
            sub: general ? `${general.campanas} campaña${general.campanas !== 1 ? "s" : ""} multi-proyecto` : undefined },
        ].map(c => (
          <div key={c.label} className={`${GLASS_BASE} p-5 flex items-center gap-4`}>
            <div className="p-2.5 bg-zinc-800/40 rounded-xl">{c.icon}</div>
            <div>
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className="text-xl font-bold text-zinc-100 mt-0.5">{c.valor}</p>
              {c.sub && <p className="text-[11px] text-zinc-400 mt-0.5">{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Barras de inversión dedicada */}
      <div className={`${GLASS_BASE} p-6`}>
        <h3 className="text-sm font-semibold text-zinc-300 mb-5">Inversión por proyecto (campañas dedicadas)</h3>
        <div className="space-y-4">
          {dedicadas.map(d => {
            const s   = PROY_STYLE[d.proyecto] ?? generalStyle;
            const pct = (Number(d.gasto) / maxGasto) * 100;
            return (
              <div key={d.proyecto}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${s.badge}`}>{d.proyecto}</span>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{d.campanas} campaña{d.campanas !== 1 ? "s" : ""}</span>
                    <span className="font-semibold text-zinc-300">{fmt(Number(d.gasto))}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla por proyecto */}
      <div className={`${GLASS_BASE} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/40 text-zinc-100 uppercase text-[11px] tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Proyecto</th>
              <th className="px-5 py-3 text-right">Campañas</th>
              <th className="px-5 py-3 text-right">Inversión</th>
              <th className="px-5 py-3 text-right">Leads</th>
              <th className="px-5 py-3 text-right">CPL</th>
              <th className="px-5 py-3 text-right">Ventas</th>
              <th className="px-5 py-3 text-right">Revenue</th>
              <th className="px-5 py-3 text-right">ROAS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dedicadas.map(d => {
              const s    = PROY_STYLE[d.proyecto] ?? generalStyle;
              const roas = Number(d.roas_real);
              const roasCls = roas >= 10 ? "text-green-600 font-semibold" : roas >= 2 ? "text-amber-600" : "text-zinc-400";
              return (
                <tr key={d.proyecto} className="hover:bg-zinc-800/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.bar}`} />
                      <span className="font-medium text-zinc-200">{d.proyecto}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-zinc-400">{d.campanas}</td>
                  <td className="px-5 py-4 text-right font-medium text-zinc-200">{fmt(Number(d.gasto))}</td>
                  <td className="px-5 py-4 text-right text-zinc-400">{d.leads}</td>
                  <td className="px-5 py-4 text-right text-zinc-400">{d.cpl ? fmt(Number(d.cpl)) : "—"}</td>
                  <td className="px-5 py-4 text-right">
                    {Number(d.ventas) > 0
                      ? <span className="inline-flex items-center gap-1 text-green-700 font-semibold"><TrendingUp size={12}/>{d.ventas}</span>
                      : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-zinc-200">
                    {Number(d.revenue) > 0 ? fmtK(Number(d.revenue)) : <span className="text-zinc-300 font-normal">—</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {roas > 0 ? <span className={roasCls}>{roas.toFixed(1)}x</span> : <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
              );
            })}

            {/* Fila General */}
            {general && (
              <tr className="bg-zinc-50/80 border-t border-white/10">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <span className="text-zinc-500 italic text-xs">{general.proyecto}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-zinc-400 text-xs">{general.campanas}</td>
                <td className="px-5 py-4 text-right text-zinc-500 text-xs">{fmt(Number(general.gasto))}</td>
                <td className="px-5 py-4 text-right text-zinc-400 text-xs">{general.leads}</td>
                <td className="px-5 py-4 text-right text-zinc-300 text-xs">—</td>
                <td className="px-5 py-4 text-right text-zinc-300 text-xs">—</td>
                <td className="px-5 py-4 text-right text-zinc-300 text-xs">—</td>
                <td className="px-5 py-4 text-right">
                  <span className="text-[11px] text-zinc-400 italic">no atribuible</span>
                </td>
              </tr>
            )}
          </tbody>

          {/* Totales solo de dedicadas */}
          <tfoot className="border-t-2 border-white/10 bg-zinc-800/40">
            <tr>
              <td className="px-5 py-3 text-xs font-semibold text-zinc-100 uppercase">Proyectos</td>
              <td className="px-5 py-3 text-right text-xs text-zinc-500">{dedicadas.reduce((s,d)=>s+d.campanas,0)}</td>
              <td className="px-5 py-3 text-right text-sm font-bold text-zinc-200">{fmt(totalDedicado)}</td>
              <td className="px-5 py-3 text-right text-xs text-zinc-500">{dedicadas.reduce((s,d)=>s+d.leads,0)}</td>
              <td className="px-5 py-3" />
              <td className="px-5 py-3 text-right text-sm font-bold text-green-700">{dedicadas.reduce((s,d)=>s+Number(d.ventas),0)}</td>
              <td className="px-5 py-3 text-right text-sm font-bold text-zinc-200">{fmtK(totalRev)}</td>
              <td className="px-5 py-3 text-right text-sm font-bold text-zinc-200">
                {totalDedicado > 0 ? `${(totalRev / totalDedicado).toFixed(1)}x` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
}
