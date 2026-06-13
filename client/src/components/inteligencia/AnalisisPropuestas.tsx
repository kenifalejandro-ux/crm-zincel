/** client/src/components/inteligencia/AnalisisPropuestas.tsx */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  Target, TrendingUp, TrendingDown, Pencil, X, Check,
  ChevronDown, AlertTriangle, Lightbulb, CheckCircle2,
  Building2, Layers, Phone,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(0)}k`;
  return n > 0 ? `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}` : "—";
}

function pct(real: number, meta: number) {
  return meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0;
}

function conversion(ganadas: number, resueltas: number) {
  return resueltas > 0 ? Math.round((ganadas / resueltas) * 100) : 0;
}

// ─── Diagnóstico de brecha ────────────────────────────────────────────────────

interface BrechaInsight {
  tipo: "alerta" | "oportunidad" | "ok";
  texto: string;
}

function generarInsightsBrecha(
  data: AnalisisPipelineData,
  metas: MetasPipeline,
): BrechaInsight[] {
  const insights: BrechaInsight[] = [];
  const { mes_actual, por_empresa, por_servicio } = data;
  const { propuestas_mes, cierres_mes, ingresos_mes } = metas;
  const convGlobal = conversion(mes_actual.cierres_total, mes_actual.resueltas_total);

  // Propuestas activas vs meta mensual
  const brechaProps = propuestas_mes - mes_actual.propuestas_activas;
  if (brechaProps > 0) {
    const propNecesarias = cierres_mes > 0 && convGlobal > 0
      ? Math.ceil(cierres_mes / (convGlobal / 100))
      : propuestas_mes;
    insights.push({
      tipo: "alerta",
      texto: `Tienes ${mes_actual.propuestas_activas} propuesta${mes_actual.propuestas_activas !== 1 ? "s" : ""} activa${mes_actual.propuestas_activas !== 1 ? "s" : ""} en pipeline, tu meta mensual es ${propuestas_mes}. Con conversión del ${convGlobal}%, necesitas al menos ${propNecesarias} propuestas activas para cerrar ${cierres_mes} clientes por mes.`,
    });
  } else {
    insights.push({ tipo: "ok", texto: `Tienes ${mes_actual.propuestas_activas} propuestas activas — superaste tu meta de ${propuestas_mes}. ¡Buen ritmo de prospección!` });
  }

  // Cierres vs meta mensual
  const brechaCI = cierres_mes - mes_actual.cierres_total;
  if (brechaCI > 0) {
    const motivos: string[] = [];
    const sinRespuesta = por_empresa.filter(e => e.enviadas > 0 && e.ganadas === 0 && e.perdidas === 0).length;
    if (sinRespuesta > 0) motivos.push(`${sinRespuesta} empresa${sinRespuesta > 1 ? "s" : ""} con propuesta sin respuesta`);
    const enNeg = por_empresa.filter(e => e.en_negociacion > 0).length;
    if (enNeg > 0) motivos.push(`${enNeg} empresa${enNeg > 1 ? "s" : ""} en negociación sin cerrar`);
    insights.push({
      tipo: "alerta",
      texto: `Llevas ${mes_actual.cierres_total} cierre${mes_actual.cierres_total !== 1 ? "s" : ""} ganado${mes_actual.cierres_total !== 1 ? "s" : ""}, tu meta mensual es ${cierres_mes}.${motivos.length > 0 ? " Cuellos de botella detectados: " + motivos.join("; ") + "." : ""}`,
    });
  } else {
    insights.push({ tipo: "ok", texto: `¡Superaste tu meta de cierres! ${mes_actual.cierres_total} cierres ganados vs meta de ${cierres_mes}.` });
  }

  // Ingresos vs meta
  if (mes_actual.ingresos_total < ingresos_mes) {
    const brecha = ingresos_mes - mes_actual.ingresos_total;
    insights.push({
      tipo: "alerta",
      texto: `Ingresos ganados: ${fmt(mes_actual.ingresos_total)} vs meta ${fmt(ingresos_mes)} (brecha ${fmt(brecha)}). Tienes ${fmt(mes_actual.valor_activo)} en propuestas activas que podrían cerrar.`,
    });
  }

  // Tasa de conversión
  if (convGlobal > 0 && convGlobal < 40) {
    const servicioMasPerdido = [...por_servicio].sort((a, b) => b.perdidas - a.perdidas)[0];
    if (servicioMasPerdido) {
      insights.push({
        tipo: "oportunidad",
        texto: `Tasa de conversión: ${convGlobal}%. El servicio con más pérdidas es "${LABEL_SERVICIO[servicioMasPerdido.servicio as ServicioPropuesta] ?? servicioMasPerdido.servicio}" (${servicioMasPerdido.perdidas} perdida${servicioMasPerdido.perdidas !== 1 ? "s" : ""}). Analiza los motivos de rechazo para mejorar el cierre.`,
      });
    }
  } else if (convGlobal >= 60) {
    insights.push({
      tipo: "oportunidad",
      texto: `Tasa de conversión del ${convGlobal}% — excelente. El cuello de botella es el volumen: más propuestas = más cierres directamente. Apunta a ${Math.ceil(cierres_mes / (convGlobal / 100))} propuestas activas simultáneas.`,
    });
  }

  // Negociaciones trabadas
  const trabadas = por_empresa.filter(e => e.en_negociacion >= 2);
  if (trabadas.length > 0) {
    insights.push({
      tipo: "alerta",
      texto: `${trabadas.length} empresa${trabadas.length > 1 ? "s" : ""} con 2+ propuestas en negociación (${trabadas.map(e => e.empresa).slice(0, 3).join(", ")}). Prioriza cerrar las más avanzadas.`,
    });
  }

  return insights;
}

// ─── Objetivo card ────────────────────────────────────────────────────────────

interface ObjCardProps {
  label:   string;
  real:    string | number;
  meta:    string | number;
  pct:     number;
  color:   string;
  subt?:   string;
}

function ObjCard({ label, real, meta, pct: p, color, subt }: ObjCardProps) {
  const cumplido = p >= 100;
  return (
    <div className={`flex-1 min-w-0 ${GLASS_BASE} p-4 flex flex-col gap-2`}>
      <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-zinc-100 leading-none">{real}</span>
        <span className="text-[11px] text-zinc-400 pb-0.5">/ {meta}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${p}%`, backgroundColor: cumplido ? "#16a34a" : color }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">{p}% de la meta</p>
        {cumplido && <CheckCircle2 size={12} className="text-green-600 shrink-0" />}
      </div>
      {subt && <p className="text-[10px] text-zinc-400 leading-tight">{subt}</p>}
    </div>
  );
}

// ─── Drill-down modal propuestas ──────────────────────────────────────────────

function DrillModal({
  titulo,
  rows,
  onCerrar,
}: {
  titulo:   string;
  rows:     DetallePropuesta[];
  onCerrar: () => void;
}) {
  const ESTADO_COLOR: Record<string, string> = {
    enviada:         "bg-yellow-50 text-yellow-700",
    en_negociacion:  "bg-blue-50 text-blue-700",
    cerrada_ganada:  "bg-green-100 text-green-700",
    cerrada_perdida: "bg-red-100 text-red-700",
    vencida:         "bg-zinc-100 text-zinc-500",
  };
  const ESTADO_LABEL: Record<string, string> = {
    enviada: "Enviada", en_negociacion: "Negociación",
    cerrada_ganada: "Ganada", cerrada_perdida: "Perdida", vencida: "Vencida",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
      <div className={`${MODAL_BASE} relative w-full max-w-2xl max-h-[80vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{titulo}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{rows.length} propuesta{rows.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-zinc-800 transition">
            <X size={16} className="text-zinc-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0
            ? <p className="text-xs text-zinc-500 text-center py-10">Sin propuestas</p>
            : (
              <table className="w-full text-xs">
                <thead className={`${STICKY_BASE} sticky top-0`}>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-2 px-4 text-zinc-100 font-medium">Empresa</th>
                    <th className="text-left py-2 pr-3 text-zinc-100 font-medium">Servicio</th>
                    <th className="text-left py-2 pr-3 text-zinc-100 font-medium">Estado</th>
                    <th className="text-right py-2 pr-4 text-zinc-100 font-medium">Monto</th>
                    <th className="text-left py-2 pr-4 text-zinc-100 font-medium">Motivo pérdida</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const monto = r.moneda === "USD"
                      ? (r.monto_cerrado ?? r.monto_propuesto) * r.tipo_cambio
                      : (r.monto_cerrado ?? r.monto_propuesto);
                    return (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-zinc-800/40 transition">
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-zinc-200 truncate max-w-[130px]">{r.empresa}</p>
                          <p className="text-[10px] text-zinc-400">
                            {new Date(r.fecha_propuesta).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-300">
                          {LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`${BADGE_BASE} text-[10px] px-2 py-0.5 ${ESTADO_COLOR[r.estado] ?? "bg-zinc-800 text-zinc-400"}`}>
                            {ESTADO_LABEL[r.estado] ?? r.estado}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium text-zinc-200">{fmt(monto)}</td>
                        <td className="py-2.5 pr-4 text-zinc-500 max-w-[140px] truncate">
                          {r.motivo_cierre_perdido ?? "—"}
                        </td>
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

// ─── Tabla por empresa ────────────────────────────────────────────────────────

function TablaEmpresas({
  rows,
  detalle,
}: {
  rows:    EmpresaAnalisis[];
  detalle: Record<string, DetallePropuesta[]>;
}) {
  const c = useChartColors();
  const [drill, setDrill] = useState<{ titulo: string; rows: DetallePropuesta[] } | null>(null);

  if (rows.length === 0) return (
    <p className="text-xs text-zinc-500 text-center py-8">Sin datos de empresas</p>
  );

  const chartData = rows.slice(0, 12).map(r => ({
    name: r.empresa.length > 14 ? r.empresa.slice(0, 13) + "…" : r.empresa,
    empresa: r.empresa,
    Enviadas:     r.enviadas + r.en_negociacion,
    Ganadas:      r.ganadas,
    Perdidas:     r.perdidas,
    prospecto_id: r.prospecto_id,
  }));

  return (
    <>
      {/* Gráfico */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar filter="url(#neon-glow)" dataKey="Enviadas" fill={c.accent} radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Ganadas"  fill="#16a34a"        radius={[3, 3, 0, 0]} barSize={12} />
            <Bar filter="url(#neon-glow)" dataKey="Perdidas" fill={c.danger}  radius={[3, 3, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla */}
      <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className={`${STICKY_BASE} sticky top-0`}>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 px-3 text-zinc-100 font-medium">Empresa</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Enviadas</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Ganadas</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Perdidas</th>
              <th className="text-right py-2 pr-3 text-zinc-100 font-medium">Pipeline</th>
              <th className="text-right py-2 pr-3 text-zinc-100 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const conv = conversion(r.ganadas, r.ganadas + r.perdidas);
              return (
                <tr
                  key={r.prospecto_id}
                  onClick={() => setDrill({ titulo: r.empresa, rows: detalle[r.prospecto_id] ?? [] })}
                  className="border-b border-white/5 hover:bg-brand/5 cursor-pointer group transition"
                >
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-zinc-200 group-hover:text-brand truncate max-w-[140px]">{r.empresa}</p>
                    {r.ciudad && <p className="text-[10px] text-zinc-400">{r.ciudad}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-center text-zinc-300">{r.enviadas + r.en_negociacion}</td>
                  <td className="py-2.5 pr-3 text-center font-semibold text-green-700">{r.ganadas}</td>
                  <td className="py-2.5 pr-3 text-center text-red-500">{r.perdidas}</td>
                  <td className="py-2.5 pr-3 text-right text-zinc-300">{r.monto_activo > 0 ? fmt(r.monto_activo) : "—"}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-zinc-200">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {(r.ganadas + r.perdidas) > 0
                      ? <span className={`${BADGE_BASE} text-[10px] font-bold px-1.5 py-0.5 ${conv >= 50 ? "bg-green-100 text-green-700" : conv > 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-500"}`}>{conv}%</span>
                      : <span className="text-zinc-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drill && (
        <DrillModal titulo={drill.titulo} rows={drill.rows} onCerrar={() => setDrill(null)} />
      )}
    </>
  );
}

// ─── Tabla por servicio ───────────────────────────────────────────────────────

function TablaServicios({
  rows,
  detalle,
}: {
  rows:    ServicioAnalisis[];
  detalle: Record<string, DetallePropuesta[]>;
}) {
  const c = useChartColors();
  const [drill, setDrill] = useState<{ titulo: string; rows: DetallePropuesta[] } | null>(null);

  if (rows.length === 0) return (
    <p className="text-xs text-zinc-500 text-center py-8">Sin datos de servicios</p>
  );

  const chartData = rows.map(r => ({
    name:    LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio,
    servicio: r.servicio,
    Activas:  r.enviadas + r.en_negociacion,
    Ganadas:  r.ganadas,
    Perdidas: r.perdidas,
  }));

  return (
    <>
      {/* Gráfico */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} width={110} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
            />
            <Bar filter="url(#neon-glow)" dataKey="Activas"  fill={c.accent} radius={[0, 3, 3, 0]} barSize={10} />
            <Bar filter="url(#neon-glow)" dataKey="Ganadas"  fill="#16a34a"        radius={[0, 3, 3, 0]} barSize={10} />
            <Bar filter="url(#neon-glow)" dataKey="Perdidas" fill={c.danger}  radius={[0, 3, 3, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla */}
      <div className="mt-4 overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className={`${STICKY_BASE} sticky top-0`}>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 px-3 text-zinc-100 font-medium">Servicio</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Activas</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Ganadas</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Perdidas</th>
              <th className="text-right py-2 pr-3 text-zinc-100 font-medium">Pipeline</th>
              <th className="text-right py-2 pr-3 text-zinc-100 font-medium">Ingresos</th>
              <th className="text-center py-2 pr-3 text-zinc-100 font-medium">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const conv = conversion(r.ganadas, r.ganadas + r.perdidas);
              return (
                <tr
                  key={r.servicio}
                  onClick={() => setDrill({ titulo: LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio, rows: detalle[r.servicio] ?? [] })}
                  className="border-b border-white/5 hover:bg-brand/5 cursor-pointer group transition"
                >
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-zinc-200 group-hover:text-brand">
                      {LABEL_SERVICIO[r.servicio as ServicioPropuesta] ?? r.servicio}
                    </p>
                    <p className="text-[10px] text-zinc-400">{r.total} total</p>
                  </td>
                  <td className="py-2.5 pr-3 text-center text-zinc-300">{r.enviadas + r.en_negociacion}</td>
                  <td className="py-2.5 pr-3 text-center font-semibold text-green-700">{r.ganadas}</td>
                  <td className="py-2.5 pr-3 text-center text-red-500">{r.perdidas}</td>
                  <td className="py-2.5 pr-3 text-right text-zinc-300">{r.monto_activo > 0 ? fmt(r.monto_activo) : "—"}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold text-zinc-200">{r.monto_ganado > 0 ? fmt(r.monto_ganado) : "—"}</td>
                  <td className="py-2.5 pr-3 text-center">
                    {(r.ganadas + r.perdidas) > 0
                      ? <span className={`${BADGE_BASE} text-[10px] font-bold px-1.5 py-0.5 ${conv >= 50 ? "bg-green-100 text-green-700" : conv > 0 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-500"}`}>{conv}%</span>
                      : <span className="text-zinc-300">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drill && (
        <DrillModal titulo={drill.titulo} rows={drill.rows} onCerrar={() => setDrill(null)} />
      )}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
      </div>
    );
  }

  if (!datos) return null;

  const { mes_actual } = datos;
  const convGlobal = conversion(mes_actual.cierres_total, mes_actual.resueltas_total);
  const insights   = generarInsightsBrecha(datos, metas);

  const inputCls = "w-24 text-center px-2 py-1 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

  return (
    <div className="space-y-5">

      {/* ── Objetivos del mes ── */}
      <div className={CARD_CLASS}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-brand shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Objetivos del mes</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Real vs meta mensual · editable</p>
            </div>
          </div>
          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-brand transition"
            >
              <Pencil size={12} /> Editar metas
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setFormMetas(metas); setEditando(false); }} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition">
                <X size={12} /> Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-1 text-xs text-white bg-brand hover:bg-brand-hover px-2.5 py-1 rounded-lg transition disabled:opacity-60"
              >
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
                <p className="text-[10px] text-zinc-400">{hint}</p>
                <input
                  type="number"
                  min={1}
                  value={formMetas[key as keyof MetasPipeline]}
                  onChange={e => setFormMetas(f => ({ ...f, [key]: parseInt(e.target.value) || 1 }))}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <ObjCard
              label="Propuestas activas"
              real={mes_actual.propuestas_activas}
              meta={metas.propuestas_mes}
              pct={pct(mes_actual.propuestas_activas, metas.propuestas_mes)}
              color={c.accent}
              subt={`${mes_actual.propuestas_anio} enviadas este año`}
            />
            <ObjCard
              label="Cierres ganados"
              real={mes_actual.cierres_total}
              meta={metas.cierres_mes}
              pct={pct(mes_actual.cierres_total, metas.cierres_mes)}
              color="#27272a"
              subt={`${mes_actual.cierres_anio} cerrados este año`}
            />
            <ObjCard
              label="Ingresos ganados"
              real={fmt(mes_actual.ingresos_total)}
              meta={fmt(metas.ingresos_mes)}
              pct={pct(mes_actual.ingresos_total, metas.ingresos_mes)}
              color={c.accent}
              subt={`${fmt(mes_actual.valor_activo)} en pipeline activo`}
            />
            <div className={`flex-1 min-w-0 ${GLASS_BASE} p-4 flex flex-col gap-2`}>
              <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Tasa de conversión</p>
              <p className={`text-2xl font-bold leading-none ${convGlobal >= 60 ? "text-green-700" : convGlobal >= 40 ? "text-amber-600" : convGlobal > 0 ? "text-red-500" : "text-zinc-400"}`}>
                {convGlobal > 0 ? `${convGlobal}%` : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">
                {mes_actual.cierres_total} ganadas / {mes_actual.resueltas_total} resueltas
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Para {metas.cierres_mes} cierres/mes necesitas ~{convGlobal > 0 ? Math.ceil(metas.cierres_mes / (convGlobal / 100)) : "—"} propuestas activas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Diagnóstico de brecha ── */}
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-brand shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Diagnóstico de brecha</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">¿Por qué no llegaste al objetivo?</p>
          </div>
        </div>
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl p-3 ${
                ins.tipo === "alerta"      ? "bg-red-50 border border-red-100"
                : ins.tipo === "oportunidad" ? "bg-brand/5 border border-brand/20"
                : "bg-green-50 border border-green-100"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {ins.tipo === "alerta"      ? <AlertTriangle size={13} className="text-red-500" />
                : ins.tipo === "oportunidad" ? <Lightbulb    size={13} className="text-brand"    />
                :                             <CheckCircle2  size={13} className="text-green-600" />}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{ins.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Análisis por empresa / servicio ── */}
      <div className={CARD_CLASS}>
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/8 pb-3">
          <button
            onClick={() => setTab("empresa")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "empresa"
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-800"
            }`}
          >
            <Building2 size={12} /> Por empresa
          </button>
          <button
            onClick={() => setTab("servicio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === "servicio"
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-800"
            }`}
          >
            <Layers size={12} /> Por servicio
          </button>
          <span className="text-[10px] text-zinc-400 ml-auto">clic en fila para ver propuestas</span>
        </div>

        {tab === "empresa"
          ? <TablaEmpresas rows={datos.por_empresa} detalle={datos.detalle_empresa} />
          : <TablaServicios rows={datos.por_servicio} detalle={datos.detalle_servicio} />
        }
      </div>

    </div>
  );
}
