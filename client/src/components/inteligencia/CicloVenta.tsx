/** client/src/components/inteligencia/CicloVenta.tsx */

import { useEffect, useState } from "react";
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { getCicloVenta } from "../../services/prospectos.api";
import type { CicloVentaData, ProspectoEnRiesgo, CicloVentaTendencia, CicloVentaDetalle } from "../../services/prospectos.api";
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";

const CARD = "bg-white rounded-2xl border border-zinc-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_6px_20px_rgba(0,0,0,0.06)]";

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta",
  negociacion:       "Negociación",
};

function BarRubroRow({ rubro, total, promedio_dias, max }: { rubro: string; total: number; promedio_dias: number; max: number }) {
  const pct = max > 0 ? Math.round((promedio_dias / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-700 truncate max-w-[180px]">{rubro}</span>
        <span className="text-zinc-600 shrink-0 ml-2">{promedio_dias}d · {total} cierre{total !== 1 ? "s" : ""}</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS.primary }} />
      </div>
    </div>
  );
}

function TendenciaChart({ data }: { data: CicloVentaTendencia[] }) {
  if (data.length === 0) return (
    <p className="text-xs text-zinc-600 text-center py-4">Sin datos de tendencia aún</p>
  );
  const maxDias = Math.max(...data.map(d => d.promedio_dias), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map(d => {
        const h = Math.max(4, Math.round((d.promedio_dias / maxDias) * 72));
        return (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className="w-full rounded-t transition-colors cursor-default"
              style={{ height: `${h}px`, backgroundColor: COLORS.mutedLight }}
            />
            <span className="text-[9px] text-zinc-600">{d.mes.slice(5)}</span>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
              {d.promedio_dias}d · {d.cerrados} cierre{d.cerrados !== 1 ? "s" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiesgoRow({ p }: { p: ProspectoEnRiesgo }) {
  const urgencia = p.dias_en_pipeline > 90 ? "text-red-500" : "text-zinc-700";
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-800 truncate">{p.empresa}</p>
        <p className="text-[10px] text-zinc-600">{ETAPA_LABEL[p.etapa_pipeline] ?? p.etapa_pipeline}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <AlertTriangle size={11} className={urgencia} />
        <span className={`text-xs font-semibold ${urgencia}`}>{p.dias_en_pipeline}d</span>
      </div>
    </div>
  );
}

function FaseBar({ f1, f2, total }: { f1: number | null; f2: number | null; total: number }) {
  if (!f1 || !f2 || total === 0) return null;
  const p1 = Math.round((f1 / total) * 100);
  const p2 = Math.round((f2 / total) * 100);
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full">
      <div className="transition-all" style={{ width: `${p1}%`, backgroundColor: COLORS.mutedLight }} title={`Contacto→Propuesta: ${f1}d`} />
      <div className="transition-all" style={{ width: `${p2}%`, backgroundColor: COLORS.primary }} title={`Propuesta→Cierre: ${f2}d`} />
    </div>
  );
}

export function CicloVenta() {
  const [data, setData]         = useState<CicloVentaData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getCicloVenta()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="flex justify-center items-center py-12">
      <Loader2 size={20} className="animate-spin text-zinc-600" />
    </div>
  );

  if (!data) return null;

  const { kpis, por_rubro, en_riesgo, tendencia, detalle } = data;
  const maxRubro = Math.max(...por_rubro.map(r => r.promedio_dias), 1);
  const sinDatos = kpis.total_cerrados === 0;

  return (
    <div className="space-y-4">
      {/* KPIs — fila 1: totales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ventas cerradas",   value: sinDatos ? "—" : String(kpis.total_cerrados), icon: <CheckCircle size={14} className="text-emerald-500" />, sub: "" },
          { label: "Ciclo total prom.", value: kpis.promedio_dias != null ? `${kpis.promedio_dias}d` : "—", icon: <Clock size={14} className="text-brand" />, sub: "contacto → cierre" },
          { label: "Cierre más rápido", value: kpis.min_dias != null ? `${kpis.min_dias}d` : "—", icon: <TrendingUp size={14} className="text-zinc-600" />, sub: "" },
          { label: "Cierre más largo",  value: kpis.max_dias != null ? `${kpis.max_dias}d` : "—", icon: <Clock size={14} className="text-zinc-600" />, sub: "" },
        ].map(k => (
          <div key={k.label} className={CARD}>
            <div className="flex items-center gap-1.5 mb-1">{k.icon}<span className="text-[10px] text-zinc-600">{k.label}</span></div>
            <p className="text-xl font-bold text-zinc-800">{k.value}</p>
            {k.sub && <p className="text-[9px] text-zinc-600 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* KPIs — fila 2: desglose de fases */}
      {(kpis.promedio_contacto_propuesta != null || kpis.promedio_propuesta_cierre != null) && (
        <div className={CARD_CLASS}>
          <p className={HEADER_CLASS}><Clock size={14} className="mr-2.5 text-blue-500" strokeWidth={2} />Desglose promedio del ciclo de venta</p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Fase 1 */}
            <div className="flex-1 min-w-[130px] bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-zinc-700 font-medium mb-0.5">Contacto → Propuesta</p>
              <p className="text-2xl font-bold text-zinc-800">
                {kpis.promedio_contacto_propuesta != null ? `${kpis.promedio_contacto_propuesta}d` : "—"}
              </p>
              <p className="text-[9px] text-zinc-600 mt-0.5">tiempo de prospección</p>
            </div>

            <ArrowRight size={16} className="text-zinc-700 shrink-0" />

            {/* Fase 2 */}
            <div className="flex-1 min-w-[130px] bg-brand/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-brand font-medium mb-0.5">Propuesta → Cierre</p>
              <p className="text-2xl font-bold text-zinc-800">
                {kpis.promedio_propuesta_cierre != null ? `${kpis.promedio_propuesta_cierre}d` : "—"}
              </p>
              <p className="text-[9px] text-zinc-600 mt-0.5">tiempo de negociación</p>
            </div>

            <ArrowRight size={16} className="text-zinc-700 shrink-0" />

            {/* Total */}
            <div className="flex-1 min-w-[130px] bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-[10px] text-zinc-600 font-medium mb-0.5">Total ciclo</p>
              <p className="text-2xl font-bold text-white">
                {kpis.promedio_dias != null ? `${kpis.promedio_dias}d` : "—"}
              </p>
              <p className="text-[9px] text-zinc-600 mt-0.5">ciclo completo</p>
            </div>
          </div>

          {kpis.promedio_dias != null && kpis.promedio_dias > 0 && (
            <div className="mt-3 space-y-1">
              <FaseBar f1={kpis.promedio_contacto_propuesta} f2={kpis.promedio_propuesta_cierre} total={kpis.promedio_dias} />
              <div className="flex gap-3 text-[9px] text-zinc-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS.mutedLight }} /> Prospección</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS.primary }} /> Negociación</span>
              </div>
            </div>
          )}
        </div>
      )}

      {sinDatos && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
          <Clock size={24} className="mx-auto mb-2 text-zinc-700" />
          <p className="text-xs text-zinc-700 font-medium">Aún no hay ventas cerradas</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            El ciclo de venta se calculará automáticamente cuando muevas un lead a "Cerrado ganado"
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ciclo por empresa */}
        <div className={CARD}>
          <p className="text-xs font-semibold text-zinc-600 mb-3">Ciclo por empresa</p>
          {detalle.length === 0
            ? <p className="text-xs text-zinc-600 text-center py-4">Sin datos aún</p>
            : <div className="space-y-2.5">
                {[...detalle]
                  .sort((a, b) => a.dias_ciclo - b.dias_ciclo)
                  .map(d => {
                    const maxDias = Math.max(...detalle.map(x => x.dias_ciclo), 1);
                    const pct = Math.round((d.dias_ciclo / maxDias) * 100);
                    return (
                      <div key={d.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-700 truncate max-w-[180px]">{d.empresa}</span>
                          <span className="text-zinc-600 shrink-0 ml-2">{d.dias_ciclo}d</span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS.muted }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
          }
        </div>

        {/* Tendencia mensual */}
        <div className={CARD}>
          <p className="text-xs font-semibold text-zinc-600 mb-3">Tendencia mensual (días promedio)</p>
          <TendenciaChart data={tendencia} />
        </div>
      </div>

      {/* Análisis por industria/rubro */}
      {por_rubro.length > 0 && (
        <div className={CARD}>
          <p className="text-xs font-semibold text-zinc-600 mb-3">Ciclo por industria (rubro)</p>
          <div className="space-y-2.5">
            {por_rubro.map(r => (
              <BarRubroRow key={r.rubro} {...r} max={maxRubro} />
            ))}
          </div>
        </div>
      )}

      {/* En riesgo */}
      {en_riesgo.length > 0 && (
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-zinc-600" />
            <p className="text-xs font-semibold text-zinc-600">
              Leads que superaron el ciclo promedio ({kpis.promedio_dias}d)
            </p>
          </div>
          <div>{en_riesgo.map(p => <RiesgoRow key={p.id} p={p} />)}</div>
          <p className="text-[10px] text-zinc-600 mt-2">
            Estos leads llevan más días en el pipeline que el promedio de cierre.
          </p>
        </div>
      )}

      {/* Tabla de cierres con fases */}
      {detalle.length > 0 && (
        <div className={`${CARD_CLASS} !p-0 overflow-hidden`}>
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <p className={HEADER_CLASS}>Historial de ventas cerradas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs" style={{ minWidth: "780px", width: "100%" }}>
              <thead>
                <tr className="bg-zinc-50 text-zinc-600 uppercase text-[10px] tracking-wide">
                  <th className="text-left px-4 py-2 font-medium">Empresa</th>
                  <th className="text-left px-4 py-2 font-medium">Industria</th>
                  <th className="text-center px-3 py-2 font-medium">Contacto → Prop.</th>
                  <th className="text-center px-3 py-2 font-medium">Prop. → Cierre</th>
                  <th className="text-center px-3 py-2 font-medium">Total</th>
                  <th className="text-right px-4 py-2 font-medium">Valor (S/)</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d: CicloVentaDetalle) => {
                  const esRapido = kpis.promedio_dias != null && d.dias_ciclo < kpis.promedio_dias;
                  return (
                    <tr key={d.id} className="border-t border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-zinc-800">
                        {d.empresa}
                        {d.nombre_contacto && (
                          <span className="block text-[10px] text-zinc-600 font-normal">{d.nombre_contacto}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-700">{d.rubro ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center">
                        {d.dias_contacto_propuesta != null && d.dias_contacto_propuesta >= 0
                          ? <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">{d.dias_contacto_propuesta}d</span>
                          : <span className="text-zinc-700">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {d.dias_propuesta_cierre != null && d.dias_propuesta_cierre >= 0
                          ? <span className="px-1.5 py-0.5 rounded-md bg-brand/10 text-zinc-700 font-semibold">{d.dias_propuesta_cierre}d</span>
                          : <span className="text-zinc-700">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded-md font-semibold ${
                          esRapido ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-700"
                        }`}>
                          {d.dias_ciclo}d
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-700 font-medium">
                        {d.valor_cerrado > 0
                          ? `S/ ${d.valor_cerrado.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
