/** client/src/components/inteligencia/PaquetesWebChart.tsx */
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import { getPaquetesWeb, type PaqueteWebStat } from "../../services/propuestas.api";
import { DrilldownModal } from "./DrilldownModal";
import type { LeadDrilldown } from "./DrilldownModal";
import { getLeadsPorPaqueteWeb } from "../../services/inteligencia.api";

const PAQUETE_CFG: Record<string, { color: string; bg: string; text: string }> = {
  "Base — Web Express": { color: "#94a3b8", bg: "bg-slate-100",  text: "text-slate-600"  },
  "Gold — Web Pro":     { color: "#f59e0b", bg: "bg-amber-100",  text: "text-amber-700"  },
  "Red — Web Advanced": { color: "#ef4444", bg: "bg-red-100",    text: "text-red-600"    },
  "Blue — Web Expert":  { color: "#3b82f6", bg: "bg-blue-100",   text: "text-blue-700"   },
  "Platinum — Elite":   { color: "#8b5cf6", bg: "bg-violet-100", text: "text-violet-700" },
};

const ORDEN = [
  "Base — Web Express",
  "Gold — Web Pro",
  "Red — Web Advanced",
  "Blue — Web Expert",
  "Platinum — Elite",
];

export function PaquetesWebChart() {
  const [datos,    setDatos]    = useState<PaqueteWebStat[]>([]);
  const [cargando, setCargando] = useState(true);

  const [drilldownPaquete,  setDrilldownPaquete]  = useState<string | null>(null);
  const [drilldownLeads,    setDrilldownLeads]    = useState<LeadDrilldown[]>([]);
  const [drilldownLoading,  setDrilldownLoading]  = useState(false);

  async function abrirDrilldown(paquete: string) {
    setDrilldownPaquete(paquete);
    setDrilldownLoading(true);
    setDrilldownLeads([]);
    try {
      const rows = await getLeadsPorPaqueteWeb(paquete);
      setDrilldownLeads(rows.map(r => ({
        id:              r.id,
        empresa:         r.empresa,
        nombre_contacto: r.nombre_contacto,
        telefono:        r.telefono,
        ciudad:          r.ciudad,
        etapa_pipeline:  r.etapa_pipeline,
        extra:           r.estado_propuesta === "cerrada_ganada" ? "✓ Vendido" : `S/ ${r.monto_propuesto?.toLocaleString() ?? "—"}`,
      })));
    } catch { /* silencioso */ }
    finally { setDrilldownLoading(false); }
  }

  useEffect(() => {
    getPaquetesWeb()
      .then(setDatos)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className={CARD_CLASS}>
        <div className="animate-pulse h-40 bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  const totalCotizados = datos.reduce((s, d) => s + d.cotizados, 0);
  const totalVendidos  = datos.reduce((s, d) => s + d.vendidos,  0);
  const maxCotizados   = Math.max(...datos.map(d => d.cotizados), 1);

  // Ordenar según el orden natural de los planes
  const ordenados = [...datos].sort(
    (a, b) => ORDEN.indexOf(a.paquete) - ORDEN.indexOf(b.paquete)
  );

  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className={HEADER_CLASS}>
          <Package size={14} className="mr-2.5 text-violet-500" strokeWidth={2} />
          Paquetes Web cotizados
        </h2>
        {totalCotizados > 0 && (
          <div className="flex gap-3 text-[11px] text-zinc-500">
            <span><span className="font-bold text-zinc-700">{totalCotizados}</span> cotizados</span>
            <span><span className="font-bold text-emerald-600">{totalVendidos}</span> vendidos</span>
          </div>
        )}
      </div>

      {totalCotizados === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-8">
          Aún no hay propuestas de Desarrollo Web registradas.
        </p>
      ) : (
        <div className="space-y-3">
          {ordenados.map(d => {
            const cfg        = PAQUETE_CFG[d.paquete] ?? { color: "#9ca3af", bg: "bg-zinc-100", text: "text-zinc-500" };
            const pct        = Math.round((d.cotizados / maxCotizados) * 100);
            const tasaCierre = d.cotizados > 0 ? Math.round((d.vendidos / d.cotizados) * 100) : 0;

            return (
              <div key={d.paquete} className="cursor-pointer group" onClick={() => abrirDrilldown(d.paquete)}>
                {/* Header fila */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {d.paquete}
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-500">
                      <span className="font-bold text-zinc-800">{d.cotizados}</span> cotiz.
                    </span>
                    <span className="text-zinc-500">
                      <span className="font-bold text-emerald-600">{d.vendidos}</span> vend.
                    </span>
                    {d.precio_promedio > 0 && (
                      <span className="text-zinc-400">
                        S/ {d.precio_promedio.toLocaleString()}
                      </span>
                    )}
                    <span className={`font-semibold ${tasaCierre >= 50 ? "text-emerald-600" : tasaCierre >= 25 ? "text-amber-600" : "text-zinc-400"}`}>
                      {tasaCierre}%
                    </span>
                  </div>
                </div>
                {/* Barra cotizados */}
                <div className="relative w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                  />
                  {/* Barra vendidos superpuesta */}
                  {d.vendidos > 0 && (
                    <div
                      className="absolute top-0 left-0 h-2 rounded-full opacity-40"
                      style={{ width: `${Math.round((d.vendidos / maxCotizados) * 100)}%`, backgroundColor: "#10b981" }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Leyenda */}
          <div className="flex items-center gap-4 pt-1 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-full bg-zinc-300 inline-block" /> Cotizados</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded-full bg-emerald-400 opacity-60 inline-block" /> Vendidos</span>
            <span className="ml-auto">% = tasa de cierre</span>
          </div>
        </div>
      )}

      {drilldownPaquete && (
        <DrilldownModal
          titulo={drilldownPaquete}
          subtitulo="Empresas con este paquete cotizado · toca el teléfono para llamar"
          leads={drilldownLeads}
          cargando={drilldownLoading}
          onCerrar={() => setDrilldownPaquete(null)}
        />
      )}
    </div>
  );
}
