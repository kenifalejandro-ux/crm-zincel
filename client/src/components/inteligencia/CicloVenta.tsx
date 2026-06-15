/** client/src/components/inteligencia/CicloVenta.tsx — PREMIUM NEON
 * Antes: const CARD = "bg-white border-zinc-100..." (¡tarjeta BLANCA sobre fondo oscuro!),
 * barras bg-zinc-800, badge bg-emerald-100, tabla thead bg-zinc-800/40 text-zinc-100,
 * text-brand, riesgo text-zinc-700, fase total bg-zinc-800, tooltip bg-zinc-800.
 * Ahora: tarjetas neon, barras y badges con glow, tabla neon. Lógica/datos/meta INTACTOS.
 */

import { useEffect, useState } from "react";
import { Clock, TrendingUp, AlertTriangle, CheckCircle, Loader2, ArrowRight, Pencil, X, Check } from "lucide-react";
import { getCicloVenta } from "../../services/prospectos.api";
import type { CicloVentaData, ProspectoEnRiesgo, CicloVentaTendencia, CicloVentaDetalle, CicloVentaPorServicio } from "../../services/prospectos.api";
import { CARD_CLASS, HEADER_CLASS, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import { accentRgb, readCssVar } from "../../lib/chartTheme";

// Tarjeta neon (antes era bg-white — tarjeta blanca sobre dark)
const CARD = "bg-white/[0.025] rounded-2xl border border-white/[0.08] p-4";
const CHART4 = () => readCssVar("--chart-4", "#22d3ee");
const META_KEY = "cicloventa_meta_dias";
const META_DEFAULT = 30;

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MESES_CORTO[parseInt(m) - 1]} ${y}`;
}

const SERVICIO_LABEL: Record<string, string> = {
  desarrollo_web: "Desarrollo web", wordpress: "WordPress", diseño_marketing: "Diseño & Marketing",
  redes_sociales: "Redes sociales", publicidad_digital: "Publicidad digital", erp: "ERP", crm: "CRM", otro: "Otro",
};

const ETAPA_LABEL: Record<string, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta_enviada: "Propuesta", negociacion: "Negociación",
};

function BarRubroRow({ rubro, total, promedio_dias, max }: { rubro: string; total: number; promedio_dias: number; max: number }) {
  const pct = max > 0 ? Math.round((promedio_dias / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-300 truncate max-w-[180px]">{rubro}</span>
        <span className="text-zinc-500 shrink-0 ml-2">{promedio_dias}d · {total} cierre{total !== 1 ? "s" : ""}</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentRgb(), boxShadow: `0 0 6px ${accentRgb()}` }} />
      </div>
    </div>
  );
}

function TendenciaChart({ data, meta }: { data: CicloVentaTendencia[]; meta: number }) {
  if (data.length === 0) return <p className="text-xs text-zinc-500 text-center py-4">Sin datos de tendencia aún</p>;

  const maxDias = Math.max(...data.map(d => d.promedio_dias), meta, 1);
  const CHART_H = 80;
  const metaY = CHART_H - Math.round(Math.min(meta / maxDias, 1) * CHART_H);

  return (
    <div className="relative">
      <div className="absolute left-0 right-0 border-t-2 border-dashed z-10 flex items-center justify-end pr-1"
        style={{ top: `${metaY}px`, borderColor: "rgb(var(--accent) / 0.5)" }}>
        <span className="text-[9px] font-semibold text-accent px-1 leading-none" style={{ background: "#0a101f" }}>Meta {meta}d</span>
      </div>

      <div className="flex items-end gap-1.5" style={{ height: `${CHART_H}px` }}>
        {data.map(d => {
          const h = Math.max(4, Math.round((d.promedio_dias / maxDias) * CHART_H));
          const sobreMeta = d.promedio_dias > meta;
          const col = sobreMeta ? accentRgb() : CHART4();
          return (
            <div key={d.mes} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div className="w-full rounded-t transition-colors cursor-default" style={{ height: `${h}px`, backgroundColor: col, boxShadow: `0 0 6px ${col}88` }} />
              <span className="text-[9px] text-zinc-500">{d.mes.slice(5)}</span>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-20" style={{ background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {d.promedio_dias}d · {d.cerrados} cierre{d.cerrados !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-2 text-[9px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CHART4() }} /> Bajo meta</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentRgb() }} /> Sobre meta</span>
      </div>
    </div>
  );
}

function RiesgoRow({ p, meta }: { p: ProspectoEnRiesgo; meta: number }) {
  const critico = p.dias_en_pipeline > meta * 2;
  const col = critico ? "#f87171" : "#fbbf24";
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-200 truncate">{p.empresa}</p>
        <p className="text-[10px] text-zinc-500">{ETAPA_LABEL[p.etapa_pipeline] ?? p.etapa_pipeline}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <AlertTriangle size={11} style={{ color: col }} />
        <span className="text-xs font-semibold tabular-nums" style={{ color: col }}>{p.dias_en_pipeline}d</span>
      </div>
    </div>
  );
}

function FaseBar({ f1, f2, total }: { f1: number | null; f2: number | null; total: number }) {
  if (!f1 || !f2 || total === 0) return null;
  const p1 = Math.round((f1 / total) * 100);
  const p2 = Math.round((f2 / total) * 100);
  return (
    <div className="flex h-4 gap-0.5 rounded-lg overflow-hidden w-full">
      <div className="flex items-center justify-center transition-all rounded-l-lg" style={{ width: `${p1}%`, backgroundColor: CHART4() }} title={`Contacto→Propuesta: ${f1}d`}>
        {p1 > 15 && <span className="text-[9px] font-bold text-[#04101a]">{f1}d</span>}
      </div>
      <div className="flex items-center justify-center transition-all rounded-r-lg" style={{ width: `${p2}%`, backgroundColor: accentRgb() }} title={`Propuesta→Cierre: ${f2}d`}>
        {p2 > 15 && <span className="text-[9px] font-bold text-white">{f2}d</span>}
      </div>
    </div>
  );
}

function MetaEditor({ meta, onChange }: { meta: number; onChange: (v: number) => void }) {
  const [editando, setEditando] = useState(false);
  const [input, setInput] = useState(String(meta));

  const guardar = () => {
    const v = parseInt(input, 10);
    if (v > 0) { onChange(v); localStorage.setItem(META_KEY, String(v)); }
    setEditando(false);
  };

  if (!editando) return (
    <button onClick={() => { setInput(String(meta)); setEditando(true); }}
      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-accent transition">
      <Pencil size={10} /> Meta: {meta}d
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      <input type="number" min={1} value={input} onChange={e => setInput(e.target.value)}
        className={`${INPUT_BASE} w-14 text-xs px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40 text-right`}
        autoFocus onKeyDown={e => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setEditando(false); }} />
      <span className="text-[10px] text-zinc-500">días</span>
      <button onClick={() => setEditando(false)} className="p-0.5 text-zinc-400 hover:text-zinc-300"><X size={11} /></button>
      <button onClick={guardar} className="p-0.5 text-accent hover:opacity-80"><Check size={11} /></button>
    </div>
  );
}

export function CicloVenta({ anio }: { anio?: number }) {
  useChartColors();
  const [data, setData] = useState<CicloVentaData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [meta, setMeta] = useState<number>(() => {
    const stored = localStorage.getItem(META_KEY);
    return stored ? parseInt(stored, 10) : META_DEFAULT;
  });

  useEffect(() => {
    setCargando(true);
    getCicloVenta(anio).then(setData).catch(() => setData(null)).finally(() => setCargando(false));
  }, [anio]);

  if (cargando) return (
    <div className="flex justify-center items-center py-12"><Loader2 size={20} className="animate-spin text-zinc-500" /></div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Clock size={28} className="text-zinc-600 mb-2" />
      <p className="text-sm text-zinc-400 font-medium">No se pudieron cargar los datos</p>
      <p className="text-xs text-zinc-500 mt-1">Verifica que haya ventas cerradas con fecha de cierre registrada</p>
    </div>
  );

  const kpis = data.kpis ?? { total_cerrados: 0, promedio_dias: null, min_dias: null, max_dias: null, promedio_contacto_propuesta: null, promedio_propuesta_cierre: null };
  const por_rubro = data.por_rubro ?? [];
  const por_servicio = data.por_servicio ?? [];
  const en_riesgo = data.en_riesgo ?? [];
  const tendencia = data.tendencia ?? [];
  const detalle = data.detalle ?? [];
  const maxRubro = por_rubro.length > 0 ? Math.max(...por_rubro.map(r => r.promedio_dias), 1) : 1;
  const maxServicio = por_servicio.length > 0 ? Math.max(...por_servicio.map(s => s.promedio_dias), 1) : 1;
  const sinDatos = kpis.total_cerrados === 0;
  const bajaMeta = kpis.promedio_dias != null && kpis.promedio_dias <= meta;

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={CARD}>
          <div className="flex items-center gap-1.5 mb-1"><CheckCircle size={14} className="text-emerald-400" /><span className="text-[10px] text-zinc-500">Ventas cerradas</span></div>
          <p className="font-display text-xl font-bold text-zinc-100">{sinDatos ? "—" : kpis.total_cerrados}</p>
        </div>

        <div className={CARD}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className={bajaMeta ? "text-emerald-400" : "text-accent"} />
              <span className="text-[10px] text-zinc-500">Ciclo prom.</span>
            </div>
            <MetaEditor meta={meta} onChange={setMeta} />
          </div>
          <p className="font-display text-xl font-bold text-zinc-100">{kpis.promedio_dias != null ? `${kpis.promedio_dias}d` : "—"}</p>
          {kpis.promedio_dias != null && (
            <p className={`text-[9px] mt-0.5 font-semibold ${bajaMeta ? "text-emerald-400" : "text-accent"}`}>
              {bajaMeta ? `✓ ${meta - kpis.promedio_dias}d bajo la meta` : `↑ ${kpis.promedio_dias - meta}d sobre la meta`}
            </p>
          )}
          {kpis.promedio_dias == null && <p className="text-[9px] text-zinc-500 mt-0.5">contacto → cierre</p>}
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={14} className="text-cyan-400" /><span className="text-[10px] text-zinc-500">Más rápido</span></div>
          <p className="font-display text-xl font-bold text-zinc-100">{kpis.min_dias != null ? `${kpis.min_dias}d` : "—"}</p>
        </div>

        <div className={CARD}>
          <div className="flex items-center gap-1.5 mb-1"><Clock size={14} className="text-zinc-500" /><span className="text-[10px] text-zinc-500">Más largo</span></div>
          <p className="font-display text-xl font-bold text-zinc-100">{kpis.max_dias != null ? `${kpis.max_dias}d` : "—"}</p>
        </div>
      </div>

      {/* Desglose de fases */}
      {(kpis.promedio_contacto_propuesta != null || kpis.promedio_propuesta_cierre != null) && (
        <div className={CARD_CLASS}>
          <p className={HEADER_CLASS}><Clock size={14} className="mr-2.5 text-blue-400" strokeWidth={2} />Desglose promedio del ciclo de venta</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`${PANEL_BASE} flex-1 min-w-[130px] p-3 text-center`}>
              <p className="text-[10px] text-zinc-500 font-medium mb-0.5">Contacto → Propuesta</p>
              <p className="font-display text-2xl font-bold text-zinc-100">{kpis.promedio_contacto_propuesta != null ? `${kpis.promedio_contacto_propuesta}d` : "—"}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">tiempo de prospección</p>
            </div>
            <ArrowRight size={16} className="text-zinc-600 shrink-0" />
            <div className="flex-1 min-w-[130px] rounded-xl p-3 text-center" style={{ background: "rgb(var(--accent) / 0.07)", border: "1px solid rgb(var(--accent) / 0.2)" }}>
              <p className="text-[10px] text-accent font-medium mb-0.5">Propuesta → Cierre</p>
              <p className="font-display text-2xl font-bold text-zinc-100">{kpis.promedio_propuesta_cierre != null ? `${kpis.promedio_propuesta_cierre}d` : "—"}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">tiempo de negociación</p>
            </div>
            <ArrowRight size={16} className="text-zinc-600 shrink-0" />
            <div className="flex-1 min-w-[130px] rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10px] text-zinc-500 font-medium mb-0.5">Total ciclo</p>
              <p className="font-display text-2xl font-bold text-zinc-50">{kpis.promedio_dias != null ? `${kpis.promedio_dias}d` : "—"}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">ciclo completo</p>
            </div>
          </div>

          {kpis.promedio_dias != null && kpis.promedio_dias > 0 && (
            <div className="mt-4 space-y-2">
              <FaseBar f1={kpis.promedio_contacto_propuesta} f2={kpis.promedio_propuesta_cierre} total={kpis.promedio_dias} />
              <div className="flex gap-3 text-[9px] text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CHART4() }} /> Prospección</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentRgb() }} /> Negociación</span>
              </div>
            </div>
          )}
        </div>
      )}

      {sinDatos && (
        <div className={`${PANEL_BASE} p-4 text-center`}>
          <Clock size={24} className="mx-auto mb-2 text-zinc-500" />
          <p className="text-xs text-zinc-300 font-medium">Aún no hay ventas cerradas</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">El ciclo de venta se calculará automáticamente cuando muevas un lead a "Cerrado ganado"</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={CARD}>
          <p className="text-xs font-semibold text-zinc-400 mb-3">Ciclo por empresa</p>
          {detalle.length === 0
            ? <p className="text-xs text-zinc-500 text-center py-4">Sin datos aún</p>
            : <div className="space-y-2.5">
                {[...detalle].sort((a, b) => a.dias_ciclo - b.dias_ciclo).map(d => {
                  const maxDias = Math.max(...detalle.map(x => x.dias_ciclo), 1);
                  const pct = Math.round((d.dias_ciclo / maxDias) * 100);
                  return (
                    <div key={d.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-300 truncate max-w-[180px]">{d.empresa}</span>
                        <span className="text-zinc-500 shrink-0 ml-2">{d.dias_ciclo}d</span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#64748b", boxShadow: "0 0 5px #64748b88" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        <div className={CARD}>
          <p className="text-xs font-semibold text-zinc-400 mb-3">Tendencia mensual (días promedio)</p>
          <TendenciaChart data={tendencia} meta={meta} />
        </div>
      </div>

      {(por_rubro.length > 0 || por_servicio.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {por_rubro.length > 0 && (
            <div className={CARD}>
              <p className="text-xs font-semibold text-zinc-400 mb-3">Ciclo por industria (rubro)</p>
              <div className="space-y-2.5">{por_rubro.map(r => <BarRubroRow key={r.rubro} {...r} max={maxRubro} />)}</div>
            </div>
          )}
          {por_servicio.length > 0 && (
            <div className={CARD}>
              <p className="text-xs font-semibold text-zinc-400 mb-3">Ciclo por servicio</p>
              <div className="space-y-2.5">
                {por_servicio.map((s: CicloVentaPorServicio) => {
                  const pct = maxServicio > 0 ? Math.round((s.promedio_dias / maxServicio) * 100) : 0;
                  return (
                    <div key={s.servicio} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-300 truncate max-w-[180px]">{SERVICIO_LABEL[s.servicio] ?? s.servicio}</span>
                        <span className="text-zinc-500 shrink-0 ml-2">{s.promedio_dias}d · {s.total} cierre{s.total !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentRgb(), boxShadow: `0 0 6px ${accentRgb()}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {en_riesgo.length > 0 && (
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            <p className="text-xs font-semibold text-zinc-400">Leads que superaron la meta ({meta}d)</p>
          </div>
          <div>{en_riesgo.map(p => <RiesgoRow key={p.id} p={p} meta={meta} />)}</div>
          <p className="text-[10px] text-zinc-500 mt-2">Estos leads llevan más días en el pipeline que tu meta de cierre.</p>
        </div>
      )}

      {detalle.length > 0 && (
        <div className={`${CARD_CLASS} !p-0 overflow-hidden`}>
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <p className={HEADER_CLASS}>Historial de ventas cerradas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs" style={{ minWidth: "920px", width: "100%" }}>
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-500 uppercase text-[10px] tracking-wide">
                  <th className="text-left px-4 py-2 font-medium">Empresa</th>
                  <th className="text-left px-3 py-2 font-medium">Industria</th>
                  <th className="text-left px-3 py-2 font-medium">Inicio</th>
                  <th className="text-left px-3 py-2 font-medium">Cierre</th>
                  <th className="text-center px-3 py-2 font-medium">Contacto → Prop.</th>
                  <th className="text-center px-3 py-2 font-medium">Prop. → Cierre</th>
                  <th className="text-center px-3 py-2 font-medium">Total</th>
                  <th className="text-right px-4 py-2 font-medium">Valor (S/)</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d: CicloVentaDetalle) => {
                  const bajometaFila = kpis.promedio_dias != null && d.dias_ciclo < meta;
                  return (
                    <tr key={d.id} className="border-t border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-2.5 font-medium text-zinc-200">
                        {d.empresa}
                        {d.nombre_contacto && <span className="block text-[10px] text-zinc-500 font-normal">{d.nombre_contacto}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">{d.rubro ?? "—"}</td>
                      <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{d.fecha_primer_contacto ? fmtFecha(d.fecha_primer_contacto) : "—"}</td>
                      <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{d.fecha_cierre ? fmtFecha(d.fecha_cierre) : "—"}</td>
                      <td className="px-3 py-2.5 text-center">
                        {d.dias_contacto_propuesta != null && d.dias_contacto_propuesta >= 0
                          ? <span className="px-1.5 py-0.5 rounded-md font-semibold" style={{ background: "rgba(34,211,238,0.12)", color: "#67e8f9" }}>{d.dias_contacto_propuesta}d</span>
                          : <span className="text-zinc-500">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {d.dias_propuesta_cierre != null && d.dias_propuesta_cierre >= 0
                          ? <span className="px-1.5 py-0.5 rounded-md font-semibold bg-accent-10 text-accent">{d.dias_propuesta_cierre}d</span>
                          : <span className="text-zinc-500">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded-md font-semibold" style={bajometaFila ? { background: "rgba(52,211,153,0.15)", color: "#34d399" } : { background: "rgba(255,255,255,0.06)", color: "#d4d4d8" }}>
                          {d.dias_ciclo}d
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-medium tabular-nums">
                        {d.valor_cerrado > 0 ? `S/ ${d.valor_cerrado.toLocaleString("es-PE", { minimumFractionDigits: 0 })}` : "—"}
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