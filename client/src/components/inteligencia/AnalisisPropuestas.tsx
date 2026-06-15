/** client/src/components/inteligencia/AnalisisPropuestas.tsx — NEON
 * Migrado de tema claro → neon (lógica/datos/drill-down INTACTOS):
 *  - ObjCard: labels text-zinc-100 lavados → muted; barra bg-zinc-800 → glow; check verde.
 *  - DrillModal: badges bg-yellow-50/green-100/red-100 → chips translúcidos; thead text-zinc-100
 *    → muted; hover:bg-zinc-800/40 → neon; border-white/8 → /[0.08].
 *  - Tablas empresa/servicio: grids recharts "#f4f4f5"→translúcido, tooltip "#e4e4e7"→oscuro,
 *    ticks "#71717a"→c.axis, "#16a34a"→c.success; thead/ hover:bg-brand/5 → neon;
 *    badges conv bg-green-100/yellow-50/red-50 → translúcidos; group-hover:text-brand→accent.
 *  - Insights: bg-red-50/brand-5/green-50 → translúcidos neon; iconos text-brand→accent.
 *  - Inputs border-zinc-200 → neon-input; tabs bg-zinc-900 → acento; spinner border-brand.
 */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Target, Pencil, X, Check,
  AlertTriangle, Lightbulb, CheckCircle2,
  Building2, Layers,
} from "lucide-react";
import { CARD_CLASS, GLASS_BASE, MODAL_BASE, BADGE_BASE, STICKY_BASE } from "../../lib/tokens";
import { useChartColors } from "../../hooks/useChartColors";
import {
  getAnalisisPipeline, getMetasPipeline, actualizarMetasPipeline,
} from "../../services/propuestas.api";
import type {
  AnalisisPipelineData, EmpresaAnalisis, ServicioAnalisis,
  MetasPipeline, DetallePropuesta,
} from "../../services/propuestas.api";
import { LABEL_SERVICIO } from "../../types/propuesta.types";
import type { ServicioPropuesta } from "../../types/propuesta.types";

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}
function pct(real: number, meta: number) { return meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0; }
function conversion(ganadas: number, resueltas: number) { return resueltas > 0 ? Math.round((ganadas / resueltas) * 100) : 0; }

// chip neon por % de conversión
function convChip(conv: number): React.CSSProperties {
  const hex = conv >= 50 ? "#34d399" : conv > 0 ? "#fbbf24" : "#f87171";
  return { color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` };
}

interface BrechaInsight { tipo: "alerta" | "oportunidad" | "ok"; texto: string; }

function generarInsightsBrecha(data: AnalisisPipelineData, metas: MetasPipeline): BrechaInsight[] {
  const insights: BrechaInsight[] = [];
  const { mes_actual, por_empresa, por_servicio } = data;
  const { propuestas_mes, cierres_mes, ingresos_mes } = metas;
  const convGlobal = conversion(mes_actual.cierres_total, mes_actual.resueltas_total);

  const brechaProps = propuestas_mes - mes_actual.propuestas_activas;
  if (brechaProps > 0) {
    const propNecesarias = cierres_mes > 0 && convGlobal > 0 ? Math.ceil(cierres_mes / (convGlobal / 100)) : propuestas_mes;
    insights.push({ tipo: "alerta", texto: `Tienes ${mes_actual.propuestas_activas} propuesta${mes_actual.propuestas_activas !== 1 ? "s" : ""} activa${mes_actual.propuestas_activas !== 1 ? "s" : ""} en pipeline, tu meta mensual es ${propuestas_mes}. Con conversión del ${convGlobal}%, necesitas al menos ${propNecesarias} propuestas activas para cerrar ${cierres_mes} clientes por mes.` });
  } else {
    insights.push({ tipo: "ok", texto: `Tienes ${mes_actual.propuestas_activas} propuestas activas — superaste tu meta de ${propuestas_mes}. ¡Buen ritmo de prospección!` });
  }

  const brechaCI = cierres_mes - mes_actual.cierres_total;
  if (brechaCI > 0) {
    const motivos: string[] = [];
    const sinRespuesta = por_empresa.filter(e => e.enviadas > 0 && e.ganadas === 0 && e.perdidas === 0).length;
    if (sinRespuesta > 0) motivos.push(`${sinRespuesta} empresa${sinRespuesta > 1 ? "s" : ""} con propuesta sin respuesta`);
    const enNeg = por_empresa.filter(e => e.en_negociacion > 0).length;
    if (enNeg > 0) motivos.push(`${enNeg} empresa${enNeg > 1 ? "s" : ""} en negociación sin cerrar`);
    insights.push({ tipo: "alerta", texto: `Llevas ${mes_actual.cierres_total} cierre${mes_actual.cierres_total !== 1 ? "s" : ""} ganado${mes_actual.cierres_total !== 1 ? "s" : ""}, tu meta mensual es ${cierres_mes}.${motivos.length > 0 ? " Cuellos de botella detectados: " + motivos.join("; ") + "." : ""}` });
  } else {
    insights.push({ tipo: "ok", texto: `¡Superaste tu meta de cierres! ${mes_actual.cierres_total} cierres ganados vs meta de ${cierres_mes}.` });
  }

  if (mes_actual.ingresos_total < ingresos_mes) {
    const brecha = ingresos_mes - mes_actual.ingresos_total;
    insights.push({ tipo: "alerta", texto: `Ingresos ganados: ${fmt(mes_actual.ingresos_total)} vs meta ${fmt(ingresos_mes)} (brecha ${fmt(brecha)}). Tienes ${fmt(mes_actual.valor_activo)} en propuestas activas que podrían cerrar.` });
  }

  if (convGlobal > 0 && convGlobal < 40) {
    const servicioMasPerdido = [...por_servicio].sort((a, b) => b.perdidas - a.perdidas)[0];
    if (servicioMasPerdido) {
      insights.push({ tipo: "oportunidad", texto: `Tasa de conversión: ${convGlobal}%. El servicio con más pérdidas es "${LABEL_SERVICIO[servicioMasPerdido.servicio as ServicioPropuesta] ?? servicioMasPerdido.servicio}" (${servicioMasPerdido.perdidas} perdida${servicioMasPerdido.perdidas !== 1 ? "s" : ""}). Analiza los motivos de rechazo para mejorar el cierre.` });
    }
  } else if (convGlobal >= 60) {
    insights.push({ tipo: "oportunidad", texto: `Tasa de conversión del ${convGlobal}% — excelente. El cuello de botella es el volumen: más propuestas = más cierres directamente. Apunta a ${Math.ceil(cierres_mes / (convGlobal / 100))} propuestas activas simultáneas.` });
  }

  const trabadas = por_empresa.filter(e => e.en_negociacion >= 2);
  if (trabadas.length > 0) {
    insights.push({ tipo: "alerta", texto: `${trabadas.length} empresa${trabadas.length > 1 ? "s" : ""} con 2+ propuestas en negociación (${trabadas.map(e => e.empresa).slice(0, 3).join(", ")}). Prioriza cerrar las más avanzadas.` });
  }

  return insights;
}

interface ObjCardProps { label: string; real: string | number; meta: string | number; pct: number; color: string; subt?: string; }

function ObjCard({ label, real, meta, pct: p, color, subt }: ObjCardProps) {
  const cumplido = p >= 100;
  return (
    <div className={`flex-1 min-w-0 ${GLASS_BASE} p-4 flex flex-col gap-2`}>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-1">
        <span className="font-display text-2xl font-bold text-zinc-100 leading-none tabular-nums">{real}</span>
        <span className="text-[11px] text-zinc-500 pb-0.5">/ {meta}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06]">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: cumplido ? "#34d399" : color, boxShadow: `0 0 6px ${cumplido ? "#34d399" : color}88` }} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">{p}% de la meta</p>
        {cumplido && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
      </div>
      {subt && <p className="text-[10px] text-zinc-500 leading-tight">{subt}</p>}
    </div>
  );
}

function DrillModal({ titulo, rows, onCerrar }: { titulo: string; rows: DetallePropuesta[]; onCerrar: () => void; }) {
  const ESTADO_CHIP: Record<string, string> = {
    enviada: "#fbbf24", en_negociacion: "#60a5fa", cerrada_ganada: "#34d399", cerrada_perdida: "#f87171", vencida: "#a1a1aa",
  };
  const ESTADO_LABEL: Record<string, string> = {
    enviada: "Enviada", en_negociacion: "Negociación", cerrada_ganada: "Ganada", cerrada_perdida: "Perdida", vencida: "Vencida",
  };
  const chip = (hex: string): React.CSSProperties => ({ color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />
      <div className={`${MODAL_BASE} relative w-full max-w-2xl max-h-[80vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{titulo}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{rows.length} propuesta{rows.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-white/5 transition">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0
            ? <p className="text-xs text-zinc-500 text-center py-10">Sin propuestas</p>
            : (
              <table className="w-full text-xs">
                <thead className={`${STICKY_BASE} sticky top-0`}>
                  <tr className="border-b border-white/[0.08]">
                    {["Empresa","Servicio","Estado"].map(h => <th key={h} className="text-left py-2 px-4 text-zinc-500 font-medium">{h}</th>)}
                    <th className="text-right py-2 pr-4 text-zinc-500 font-medium">Monto</th>
                    <th className="text-left py-2 pr-4 text-zinc-500 font-medium">Motivo pérdida</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const monto = r.moneda === "USD" ? (r.monto_cerrado ?? r.monto_propuesto) * r.tipo_cambio : (r.monto_cerrado ?? r.monto_propuesto);
                    return (
                      <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition">
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-zinc-200 truncate max-w-[130px]">{r.empresa}</p>
                          <p className="text-[10px] text-zinc-500">{new Date(r.fecha_propuesta).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-300">{LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`${BADGE_BASE} text-[10px] px-2 py-0.5`} style={chip(ESTADO_CHIP[r.estado] ?? "#a1a1aa")}>
                            {ESTADO_LABEL[r.estado] ?? r.estado}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-zinc-200">{fmt(monto)}</td>
                        <td className="py-2.5 pr-4 text-zinc-500 max-w-[140px] truncate">{r.motivo_cierre_perdido ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  );
}

function TablaEmpresas({ rows, detalle }: { rows: EmpresaAnalisis[]; detalle: Record<string, DetallePropuesta[]>; }) {
  const c = useChartColors();
  const [drill, setDrill] = useState<{ titulo: string; rows: DetallePropuesta[] } | null>(null);
  if (rows.length === 0) return <p className="text-xs text-zinc-500 text-center py-8">Sin datos de empresas</p>;

  const chartData = rows.slice(0, 12).map(r => ({
    name: r.empresa.length > 14 ? r.empresa.slice(0, 13) + "…" : r.empresa,
    empresa: r.empresa, Enviadas: r.enviadas + r.en_negociacion, Ganadas: r.ganadas, Perdidas: r.perdidas, prospecto_id: r.prospecto_id,
  }));

  return (
    <>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: c.axis }} />
            <YAxis tick={{ fontSize: 10, fill: c.axis }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar filter="url(#neon-glow)" dataKey="Enviadas" fill={c.accent}  radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Ganadas"  fill={c.success} radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Perdidas" fill={c.danger}  radius={[3, 3, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className={`${STICKY_BASE} sticky top-0`}>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-2 px-3 text-zinc-500 font-medium">Empresa</th>
              {["Enviadas","Ganadas","Perdidas"].map(h => <th key={h} className="text-center py-2 pr-3 text-zinc-500 font-medium">{h}</th>)}
              <th className="text-right py-2 pr-3 text-zinc-500 font-medium">Pipeline</th>
              <th className="text-right py-2 pr-3 text-zinc-500 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-500 font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const conv = conversion(r.ganadas, r.ganadas + r.perdidas);
              return (
                <tr key={r.prospecto_id} onClick={() => setDrill({ titulo: r.empresa, rows: detalle[r.prospecto_id] ?? [] })}
                  className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer group transition">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-zinc-200 group-hover:text-accent truncate max-w-[140px]">{r.empresa}</p>
                    {r.ciudad && <p className="text-[10px] text-zinc-500">{r.ciudad}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-center text-zinc-300">{r.enviadas + r.en_negociacion}</td>
                  <td className="py-2.5 pr-3 text-center font-semibold text-emerald-400">{r.ganadas}</td>
                  <td className="py-2.5 pr-3 text-center text-red-400">{r.perdidas}</td>
                  <td className="py-2.5 pr-3 text-right text-zinc-300">{r.monto_activo > 0 ? fmt(r.monto_activo) : "—"}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-zinc-200">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {(r.ganadas + r.perdidas) > 0
                      ? <span className={`${BADGE_BASE} text-[10px] font-bold px-1.5 py-0.5`} style={convChip(conv)}>{conv}%</span>
                      : <span className="text-zinc-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drill && <DrillModal titulo={drill.titulo} rows={drill.rows} onCerrar={() => setDrill(null)} />}
    </>
  );
}

function TablaServicios({ rows, detalle }: { rows: ServicioAnalisis[]; detalle: Record<string, DetallePropuesta[]>; }) {
  const c = useChartColors();
  const [drill, setDrill] = useState<{ titulo: string; rows: DetallePropuesta[] } | null>(null);
  if (rows.length === 0) return <p className="text-xs text-zinc-500 text-center py-8">Sin datos de servicios</p>;

  const chartData = rows.map(r => ({
    name: LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio,
    servicio: r.servicio, Activas: r.enviadas + r.en_negociacion, Ganadas: r.ganadas, Perdidas: r.perdidas,
  }));

  return (
    <>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: c.axis }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: c.axis }} width={110} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "rgba(10,16,31,0.97)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar filter="url(#neon-glow)" dataKey="Activas"  fill={c.accent}  radius={[0, 3, 3, 0]} barSize={10} />
            <Bar filter="url(#neon-glow)" dataKey="Ganadas"  fill={c.success} radius={[0, 3, 3, 0]} barSize={10} />
            <Bar filter="url(#neon-glow)" dataKey="Perdidas" fill={c.danger}  radius={[0, 3, 3, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className={`${STICKY_BASE} sticky top-0`}>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left py-2 px-3 text-zinc-500 font-medium">Servicio</th>
              {["Activas","Ganadas","Perdidas"].map(h => <th key={h} className="text-center py-2 pr-3 text-zinc-500 font-medium">{h}</th>)}
              <th className="text-right py-2 pr-3 text-zinc-500 font-medium">Pipeline</th>
              <th className="text-right py-2 pr-3 text-zinc-500 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-500 font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const conv = conversion(r.ganadas, r.ganadas + r.perdidas);
              return (
                <tr key={r.servicio} onClick={() => setDrill({ titulo: LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio, rows: detalle[r.servicio] ?? [] })}
                  className="border-b border-white/[0.05] hover:bg-white/[0.03] cursor-pointer group transition">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-zinc-200 group-hover:text-accent">{LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio}</p>
                    <p className="text-[10px] text-zinc-500">{r.total} total</p>
                  </td>
                  <td className="py-2.5 pr-3 text-center text-zinc-300">{r.enviadas + r.en_negociacion}</td>
                  <td className="py-2.5 pr-3 text-center font-semibold text-emerald-400">{r.ganadas}</td>
                  <td className="py-2.5 pr-3 text-center text-red-400">{r.perdidas}</td>
                  <td className="py-2.5 pr-3 text-right text-zinc-300">{r.monto_activo > 0 ? fmt(r.monto_activo) : "—"}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-zinc-200">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {(r.ganadas + r.perdidas) > 0
                      ? <span className={`${BADGE_BASE} text-[10px] font-bold px-1.5 py-0.5`} style={convChip(conv)}>{conv}%</span>
                      : <span className="text-zinc-500">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drill && <DrillModal titulo={drill.titulo} rows={drill.rows} onCerrar={() => setDrill(null)} />}
    </>
  );
}

type Tab = "empresa" | "servicio";

export function AnalisisPropuestas() {
  const c = useChartColors();
  const [datos,      setDatos]      = useState<AnalisisPipelineData | null>(null);
  const [metas,      setMetas]      = useState<MetasPipeline>({ propuestas_mes: 10, cierres_mes: 3, ingresos_mes: 15000 });
  const [cargando,   setCargando]   = useState(true);
  const [editando,   setEditando]   = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [formMetas,  setFormMetas]  = useState<MetasPipeline>(metas);
  const [tab,        setTab]        = useState<Tab>("empresa");

  useEffect(() => {
    setCargando(true);
    Promise.all([getAnalisisPipeline(), getMetasPipeline()])
      .then(([d, m]) => { setDatos(d); setMetas(m); setFormMetas(m); })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const updated = await actualizarMetasPipeline(formMetas);
      setMetas(updated);
      setEditando(false);
    } catch { /* silencioso */ }
    finally { setGuardando(false); }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: "rgb(var(--accent))", borderTopColor: "transparent" }} />
      </div>
    );
  }
  if (!datos) return null;

  const { mes_actual } = datos;
  const convGlobal = conversion(mes_actual.cierres_total, mes_actual.resueltas_total);
  const insights   = generarInsightsBrecha(datos, metas);

  return (
    <div className="space-y-5">

      {/* Objetivos del mes */}
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Objetivos del mes</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Real vs meta mensual · editable</p>
            </div>
          </div>
          {!editando ? (
            <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-accent transition">
              <Pencil size={12} /> Editar metas
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setFormMetas(metas); setEditando(false); }} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition">
                <X size={12} /> Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg disabled:opacity-60">
                <Check size={12} /> {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          )}
        </div>

        {editando ? (
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "propuestas_mes", label: "Meta propuestas / mes", hint: "cuántas enviar" },
              { key: "cierres_mes",    label: "Meta cierres / mes",    hint: "cuántas cerrar" },
              { key: "ingresos_mes",   label: "Meta ingresos / mes (S/)", hint: "en soles" },
            ].map(({ key, label, hint }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-zinc-300">{label}</p>
                <p className="text-[10px] text-zinc-500">{hint}</p>
                <input type="number" min={1} value={formMetas[key as keyof MetasPipeline]}
                  onChange={e => setFormMetas(f => ({ ...f, [key]: parseInt(e.target.value) || 1 }))}
                  className="neon-input w-24 text-center px-2 py-1 text-xs" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <ObjCard label="Propuestas activas" real={mes_actual.propuestas_activas} meta={metas.propuestas_mes} pct={pct(mes_actual.propuestas_activas, metas.propuestas_mes)} color={c.accent} subt={`${mes_actual.propuestas_anio} enviadas este año`} />
            <ObjCard label="Cierres ganados" real={mes_actual.cierres_total} meta={metas.cierres_mes} pct={pct(mes_actual.cierres_total, metas.cierres_mes)} color="#64748b" subt={`${mes_actual.cierres_anio} cerrados este año`} />
            <ObjCard label="Ingresos ganados" real={fmt(mes_actual.ingresos_total)} meta={fmt(metas.ingresos_mes)} pct={pct(mes_actual.ingresos_total, metas.ingresos_mes)} color={c.accent} subt={`${fmt(mes_actual.valor_activo)} en pipeline activo`} />
            <div className={`flex-1 min-w-0 ${GLASS_BASE} p-4 flex flex-col gap-2`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tasa de conversión</p>
              <p className="font-display text-2xl font-bold leading-none tabular-nums" style={{ color: convGlobal >= 60 ? "#34d399" : convGlobal >= 40 ? "#fbbf24" : convGlobal > 0 ? "#f87171" : "#a1a1aa" }}>
                {convGlobal > 0 ? `${convGlobal}%` : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">{mes_actual.cierres_total} ganadas / {mes_actual.resueltas_total} resueltas</p>
              <p className="text-[10px] text-zinc-500 leading-tight">Para {metas.cierres_mes} cierres/mes necesitas ~{convGlobal > 0 ? Math.ceil(metas.cierres_mes / (convGlobal / 100)) : "—"} propuestas activas</p>
            </div>
          </div>
        )}
      </div>

      {/* Diagnóstico de brecha */}
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-accent shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Diagnóstico de brecha</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">¿Por qué no llegaste al objetivo?</p>
          </div>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => {
            const cfg = ins.tipo === "alerta"
              ? { bg: "rgba(248,113,113,0.08)", br: "rgba(248,113,113,0.25)" }
              : ins.tipo === "oportunidad"
              ? { bg: "rgb(var(--accent) / 0.06)", br: "rgb(var(--accent) / 0.25)" }
              : { bg: "rgba(52,211,153,0.08)", br: "rgba(52,211,153,0.25)" };
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.br}` }}>
                <div className="shrink-0 mt-0.5">
                  {ins.tipo === "alerta"      ? <AlertTriangle size={13} className="text-red-400" />
                  : ins.tipo === "oportunidad" ? <Lightbulb    size={13} className="text-accent" />
                  :                              <CheckCircle2  size={13} className="text-emerald-400" />}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{ins.texto}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Análisis por empresa / servicio */}
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-1 mb-5 border-b border-white/[0.08] pb-3">
          <button onClick={() => setTab("empresa")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === "empresa" ? "bg-accent-15 text-accent border border-accent-30" : "text-zinc-500 hover:bg-white/[0.04]"}`}>
            <Building2 size={12} /> Por empresa
          </button>
          <button onClick={() => setTab("servicio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === "servicio" ? "bg-accent-15 text-accent border border-accent-30" : "text-zinc-500 hover:bg-white/[0.04]"}`}>
            <Layers size={12} /> Por servicio
          </button>
          <span className="text-[10px] text-zinc-500 ml-auto">clic en fila para ver propuestas</span>
        </div>

        {tab === "empresa"
          ? <TablaEmpresas rows={datos.por_empresa} detalle={datos.detalle_empresa} />
          : <TablaServicios rows={datos.por_servicio} detalle={datos.detalle_servicio} />
        }
      </div>

    </div>
  );
}