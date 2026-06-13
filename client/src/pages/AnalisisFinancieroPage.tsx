/** client/src/pages/AnalisisFinancieroPage.tsx */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Droplets, Wallet, PieChart as PieIcon, Scale,
  TrendingUp, BarChart2, Users, Banknote, RefreshCw,
  CheckCircle2, XCircle, ChevronRight, Activity,
  Printer, Info,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";

import { getAnalisisFinanciero }  from "../services/finanzas.api";
import { getEmpresas, getPeriodos, getAnalisisEmpresa } from "../services/analisisEmpresas.api";
import { CARD_CLASS, HEADER_CLASS, TOOLTIP_BASE, BADGE_BASE, INPUT_BASE }             from "../lib/tokens";
import { useChartColors } from "../hooks/useChartColors";
import type { AnalisisFinanciero, EstadoIndicador, SemaforoFinanciero } from "../types/finanzas.types";
import type { EmpresaAnalisis, PeriodoFinanciero, AnalisisEmpresa, IndicadorConGauge } from "../types/analisisEmpresas.types";

// ── Estado → estilo ─────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoIndicador, { label: string; color: string; hex: string; bg: string; dot: string }> = {
  optimo:      { label: "Óptimo",       color: "text-emerald-600", hex: "#059669", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  excelente:   { label: "Excelente",    color: "text-emerald-600", hex: "#059669", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  bueno:       { label: "Bueno",        color: "text-emerald-600", hex: "#059669", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  riesgo_bajo: { label: "Bajo",         color: "text-emerald-600", hex: "#059669", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  aceptable:   { label: "Aceptable",    color: "text-amber-600",   hex: "#d97706", bg: "bg-amber-50",    dot: "bg-amber-500"   },
  moderado:    { label: "Moderado",     color: "text-amber-600",   hex: "#d97706", bg: "bg-amber-50",    dot: "bg-amber-500"   },
  atencion:    { label: "Atención",     color: "text-amber-600",   hex: "#d97706", bg: "bg-amber-50",    dot: "bg-amber-500"   },
  por_mejorar: { label: "Por Mejorar",  color: "text-red-500",     hex: "#dc2626", bg: "bg-red-50",      dot: "bg-red-500"     },
  critico:     { label: "Crítico",      color: "text-red-500",     hex: "#dc2626", bg: "bg-red-50",      dot: "bg-red-500"     },
  riesgo_alto: { label: "Riesgo Alto",  color: "text-red-500",     hex: "#dc2626", bg: "bg-red-50",      dot: "bg-red-500"     },
  alto_riesgo: { label: "Alto Riesgo",  color: "text-red-500",     hex: "#dc2626", bg: "bg-red-50",      dot: "bg-red-500"     },
  sin_datos:   { label: "Sin datos",    color: "text-zinc-400",    hex: "#a1a1aa", bg: "bg-zinc-50",     dot: "bg-zinc-300"    },
};

// ── Gauge velocímetro con zonas rojo/naranja/verde ───────────────

function GaugeChart({ pct, colorHex }: { pct: number; colorHex: string }) {
  const safe = Math.min(1, Math.max(0, pct));
  return (
    <PieChart width={130} height={75}>
      {/* Zona de fondo: rojo | naranja | verde */}
      <Pie filter="url(#neon-glow)"
        data={[{ v: 1 }, { v: 1 }, { v: 1 }]}
        startAngle={180} endAngle={0}
        cx={65} cy={70}
        innerRadius={42} outerRadius={58}
        dataKey="v" strokeWidth={2} stroke="white"
        isAnimationActive={false}
      >
        <Cell fill="#fca5a5" />
        <Cell fill="#fde68a" />
        <Cell fill="#6ee7b7" />
      </Pie>
      {/* Indicador de posición */}
      <Pie filter="url(#neon-glow)"
        data={[{ v: safe }, { v: Math.max(0.001, 1 - safe) }]}
        startAngle={180} endAngle={0}
        cx={65} cy={70}
        innerRadius={42} outerRadius={58}
        dataKey="v" strokeWidth={0}
        isAnimationActive={false}
      >
        <Cell fill={colorHex} />
        <Cell fill="transparent" />
      </Pie>
    </PieChart>
  );
}

// ── Tarjeta de indicador con gauge ───────────────────────────────

type LucideIconProps = { size?: number; className?: string; strokeWidth?: number };

interface GaugeCardProps {
  numero:      number;
  titulo:      string;
  indicador:   IndicadorConGauge;
  formatear:   (v: number) => string;
  descripcion: string;
  Icon:        React.ComponentType<LucideIconProps>;
}

function GaugeCard({ numero, titulo, indicador, formatear, descripcion, Icon }: GaugeCardProps) {
  const cfg     = ESTADO_CFG[indicador.estado] ?? ESTADO_CFG.sin_datos;
  const display = indicador.valor !== null ? formatear(indicador.valor) : "N/D";

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest leading-tight">
          {numero}. {titulo}
        </span>
        <Icon size={14} className={`${cfg.color} flex-shrink-0`} />
      </div>
      <div className="flex flex-col items-center">
        <GaugeChart pct={indicador.gauge_pct} colorHex={cfg.hex} />
        <p className={`text-xl font-extrabold tracking-tight -mt-1 ${cfg.color}`}>{display}</p>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${cfg.bg} ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 text-center leading-relaxed border-t border-white/5 pt-2 min-h-[28px]">
        {descripcion}
      </p>
    </div>
  );
}

// ── Semáforo general ─────────────────────────────────────────────

const SEMAFORO_CFG: Record<SemaforoFinanciero, { titulo: string; desc: string; v: boolean; a: boolean; r: boolean }> = {
  estable:   { titulo: "Estable",   desc: "Situación financiera sana. Buena liquidez y rentabilidad.",           v: true,  a: false, r: false },
  en_riesgo: { titulo: "En Riesgo", desc: "Algunos indicadores requieren atención. Revisar flujo y deuda.",      v: false, a: true,  r: false },
  critico:   { titulo: "Crítico",   desc: "Múltiples indicadores en zona de riesgo. Acción inmediata recomendada.", v: false, a: false, r: true  },
};

function SemaforoGeneral({ semaforo }: { semaforo: SemaforoFinanciero }) {
  const cfg = SEMAFORO_CFG[semaforo];
  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}><span className="w-2 h-2 rounded-full bg-zinc-400 mr-2.5 inline-block" />Semáforo</h3>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${cfg.v ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-zinc-700"}`} />
          <div className={`w-5 h-5 rounded-full ${cfg.a ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"  : "bg-zinc-700"}`} />
          <div className={`w-5 h-5 rounded-full ${cfg.r ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"    : "bg-zinc-700"}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-200">{cfg.titulo}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed max-w-[180px]">{cfg.desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────

const TooltipSimple = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-2 text-xs`}>
      <p className="font-medium text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.stroke }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={`${TOOLTIP_BASE} px-3 py-2 text-xs`}>
      <p className="font-semibold text-zinc-300">{d.nombre}</p>
      <p className="text-zinc-500">S/ {Number(d.valor).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
      <p className="text-zinc-400">{d.porcentaje?.toFixed(1)}%</p>
    </div>
  );
};

// ── Formato ──────────────────────────────────────────────────────

const fmt  = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
const fmt2 = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 2 });
const fmtP = (n: number) => `${n.toFixed(2)}%`;

// ── Config: interpretación de los 8 indicadores ──────────────────

interface IndConfig {
  nombre:     string;
  rango_ok:   string;
  rango_med:  string;
  rango_mal:  string;
  diagnostico: (v: number | null, e: EstadoIndicador) => string;
  accion:      (v: number | null, e: EstadoIndicador) => string;
}

const ESTADOS_OK  = new Set<EstadoIndicador>(["optimo","excelente","bueno","riesgo_bajo"]);
const ESTADOS_MED = new Set<EstadoIndicador>(["aceptable","moderado","atencion"]);

const IND_CFG: Record<string, IndConfig> = {
  liquidez_corriente: {
    nombre: "Liquidez Corriente",
    rango_ok:  "≥ 1.5", rango_med: "1.0 – 1.49", rango_mal: "< 1.0",
    diagnostico: (v, e) => {
      if (!v) return "Sin pasivos corrientes para calcular.";
      if (ESTADOS_OK.has(e))  return `Cubre ${v.toFixed(2)}× sus deudas de corto plazo. Posición de liquidez saludable.`;
      if (ESTADOS_MED.has(e)) return `Cubre apenas ${v.toFixed(2)}× sus deudas. Margen de seguridad ajustado.`;
      return `Déficit: solo cubre ${(v * 100).toFixed(0)}% de las deudas corrientes. Riesgo de insolvencia a corto plazo.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Mantener política de cobros. Considerar inversiones de corto plazo con el excedente.";
      if (ESTADOS_MED.has(e)) return "Acelerar cobros de CxC y reducir el ciclo de efectivo. Negociar plazos con proveedores.";
      return "Urgente: inyectar capital, refinanciar deuda corriente a largo plazo o liquidar activos no esenciales.";
    },
  },
  capital_trabajo: {
    nombre: "Capital de Trabajo",
    rango_ok:  "> 0 (positivo)", rango_med: "≈ 0", rango_mal: "< 0 (negativo)",
    diagnostico: (v, e) => {
      if (v === null) return "Sin datos suficientes.";
      if (v >= 0) return `Capital de trabajo positivo de ${fmt(v)}. Opera con holgura financiera.`;
      return `Déficit de capital de trabajo: ${fmt(Math.abs(v))}. Los activos corrientes no cubren los pasivos.`;
    },
    accion: (v, _) => {
      if (v === null) return "Completar datos del balance.";
      if (v >= 0) return "Mantener. Vigilar que el capital de trabajo crezca al mismo ritmo que las ventas.";
      return "Revisar ciclo de conversión de efectivo. Reducir inventarios o acelerar cobros.";
    },
  },
  endeudamiento: {
    nombre: "Nivel de Endeudamiento",
    rango_ok:  "< 50%", rango_med: "50% – 69%", rango_mal: "≥ 70%",
    diagnostico: (v, e) => {
      if (v === null) return "Sin activos totales registrados.";
      if (ESTADOS_OK.has(e))  return `${v.toFixed(1)}% de activos financiados por deuda. Estructura conservadora y sólida.`;
      if (ESTADOS_MED.has(e)) return `${v.toFixed(1)}% de activos financiados por deuda. Nivel moderado; vigilar tendencia.`;
      return `${v.toFixed(1)}% de activos dependen de terceros. Alta exposición a riesgo financiero y costo de deuda.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Nivel adecuado. Puede considerar deuda estratégica para crecimiento si el ROI lo justifica.";
      if (ESTADOS_MED.has(e)) return "Priorizar pago de pasivos o aumentar patrimonio antes de contraer nueva deuda.";
      return "Urgente: plan de reducción de deuda, renegociación de tasas y evaluación de aumento de capital.";
    },
  },
  deuda_patrimonio: {
    nombre: "Deuda / Patrimonio",
    rango_ok:  "< 1.0×", rango_med: "1.0 – 2.0×", rango_mal: "> 2.0×",
    diagnostico: (v, e) => {
      if (v === null) return "Patrimonio ≤ 0, no aplica.";
      if (ESTADOS_OK.has(e))  return `Por cada sol propio hay ${v.toFixed(2)} sol de deuda. Apalancamiento conservador.`;
      if (ESTADOS_MED.has(e)) return `Por cada sol propio hay ${v.toFixed(2)} soles de deuda. Apalancamiento moderado.`;
      return `Deuda excede ${v.toFixed(2)}× el patrimonio. Dependencia excesiva de financiamiento externo.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Estructura financiera saludable. Mantener.";
      if (ESTADOS_MED.has(e)) return "Evaluar crecimiento de patrimonio vía retención de utilidades.";
      return "Reestructuración de deuda prioritaria. Evaluar aumento de capital o venta de activos.";
    },
  },
  roe: {
    nombre: "ROE — Rentabilidad del Patrimonio",
    rango_ok:  "≥ 20%", rango_med: "10% – 19%", rango_mal: "< 10%",
    diagnostico: (v, e) => {
      if (v === null) return "Patrimonio insuficiente para calcular.";
      if (ESTADOS_OK.has(e))  return `El capital de los socios genera ${v.toFixed(1)}% de retorno anual. Muy rentable.`;
      if (ESTADOS_MED.has(e)) return `Retorno de ${v.toFixed(1)}% sobre patrimonio. Rentabilidad moderada.`;
      return v < 0 ? `ROE negativo (${v.toFixed(1)}%). La empresa está destruyendo valor para los socios.`
                   : `ROE de solo ${v.toFixed(1)}%. Inferior al costo de oportunidad del capital.`;
    },
    accion: (v, e) => {
      if (ESTADOS_OK.has(e))  return "Excelente retorno. Reinvertir utilidades en áreas de mayor rentabilidad.";
      if (ESTADOS_MED.has(e)) return "Identificar márgenes mejorables: precios, estructura de costos o rotación de activos.";
      return v !== null && v < 0 ? "Revisar estructura de costos urgente. Eliminar líneas no rentables." : "Revisar modelo de negocio y estructura de costos para mejorar márgenes.";
    },
  },
  roa: {
    nombre: "ROA — Rentabilidad de Activos",
    rango_ok:  "≥ 10%", rango_med: "5% – 9%", rango_mal: "< 5%",
    diagnostico: (v, e) => {
      if (v === null) return "Sin activos registrados.";
      if (ESTADOS_OK.has(e))  return `Cada sol de activos genera ${v.toFixed(1)}% de utilidad. Alta eficiencia operativa.`;
      if (ESTADOS_MED.has(e)) return `Retorno de ${v.toFixed(1)}% sobre activos totales. Eficiencia aceptable.`;
      return `Solo ${v.toFixed(1)}% de retorno sobre activos. Los activos no están siendo bien aprovechados.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Alta eficiencia. Analizar si se puede escalar el modelo.";
      if (ESTADOS_MED.has(e)) return "Revisar activos improductivos y optimizar su uso.";
      return "Identificar y liquidar activos improductivos. Mejorar márgenes operativos.";
    },
  },
  concentracion_cxc: {
    nombre: "Concentración CxC",
    rango_ok:  "< 30%", rango_med: "30% – 59%", rango_mal: "≥ 60%",
    diagnostico: (v, e) => {
      if (v === null) return "Sin activos corrientes registrados.";
      if (ESTADOS_OK.has(e))  return `Solo ${v.toFixed(1)}% de activos corrientes en CxC. Liquidez bien diversificada.`;
      if (ESTADOS_MED.has(e)) return `${v.toFixed(1)}% de activos corrientes comprometidos en CxC. Riesgo de cobro moderado.`;
      return `${v.toFixed(1)}% de activos corrientes en CxC. Alta exposición a riesgo de incobrabilidad.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Nivel adecuado. Mantener política de crédito actual.";
      if (ESTADOS_MED.has(e)) return "Revisar plazos de crédito a clientes y días promedio de cobro.";
      return "Implementar políticas de cobro más estrictas, factoring o descuentos por pronto pago.";
    },
  },
  disponibilidad_inmediata: {
    nombre: "Disponibilidad Inmediata",
    rango_ok:  "≥ 20%", rango_med: "10% – 19%", rango_mal: "< 10%",
    diagnostico: (v, e) => {
      if (v === null) return "Sin pasivos corrientes registrados.";
      if (ESTADOS_OK.has(e))  return `El ${v.toFixed(1)}% de la deuda corriente está cubierta con caja. Posición líquida sólida.`;
      if (ESTADOS_MED.has(e)) return `Solo el ${v.toFixed(1)}% en caja vs deuda corriente. Liquidez ajustada.`;
      return `Caja cubre apenas el ${v.toFixed(1)}% de la deuda corriente. Riesgo de liquidez inmediata.`;
    },
    accion: (_, e) => {
      if (ESTADOS_OK.has(e))  return "Buena posición de caja. Considerar reducir efectivo ocioso en inversiones de corto plazo.";
      if (ESTADOS_MED.has(e)) return "Mantener línea de crédito disponible como respaldo de liquidez.";
      return "Urgente: crear fondo de emergencia y asegurar líneas de crédito de contingencia.";
    },
  },
};

// ── Tabla de interpretación ──────────────────────────────────────

interface TablaInterpretacionProps {
  indicadores: Record<string, IndicadorConGauge>;
  formatearPorClave: Record<string, (v: number) => string>;
}

function TablaInterpretacion({ indicadores, formatearPorClave }: TablaInterpretacionProps) {
  const keys = Object.keys(IND_CFG);
  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <Info size={14} className="mr-2.5 text-blue-500" />
        Tabla de interpretación detallada
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 pr-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest w-32">Indicador</th>
              <th className="text-right py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest w-20">Valor</th>
              <th className="text-left py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest w-24 hidden sm:table-cell">Rango Óptimo</th>
              <th className="text-center py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest w-20">Estado</th>
              <th className="text-left py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Diagnóstico</th>
              <th className="text-left py-2 pl-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest hidden lg:table-cell">Acción Recomendada</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key, idx) => {
              const cfg  = IND_CFG[key];
              const ind  = (indicadores as any)[key] as IndicadorConGauge | undefined;
              if (!ind) return null;
              const ecfg = ESTADO_CFG[ind.estado] ?? ESTADO_CFG.sin_datos;
              const fmt  = formatearPorClave[key] ?? ((v: number) => v.toString());
              return (
                <tr key={key} className={`border-b border-white/5 ${idx % 2 === 0 ? "" : "bg-zinc-50/40"}`}>
                  <td className="py-2.5 pr-3 font-semibold text-zinc-300 leading-tight">{cfg.nombre}</td>
                  <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${ecfg.color}`}>
                    {ind.valor !== null ? fmt(ind.valor) : "N/D"}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500 hidden sm:table-cell font-mono text-[9px]">{cfg.rango_ok}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${ecfg.bg} ${ecfg.color}`}>
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${ecfg.dot}`} />
                      {ecfg.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 leading-relaxed">
                    {cfg.diagnostico(ind.valor, ind.estado)}
                  </td>
                  <td className="py-2.5 pl-3 text-zinc-500 leading-relaxed hidden lg:table-cell">
                    {cfg.accion(ind.valor, ind.estado)}
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

// ── Benchmarks sectoriales ───────────────────────────────────────

type BenchmarkSector = {
  liquidez_corriente: number;
  endeudamiento: number;
  roe: number;
  roa: number;
  disponibilidad_inmediata: number;
  deuda_patrimonio: number;
};

const BENCHMARKS: Record<string, BenchmarkSector> = {
  "Servicios profesionales": { liquidez_corriente: 1.50, endeudamiento: 50, roe: 20, roa: 10, disponibilidad_inmediata: 25, deuda_patrimonio: 1.0 },
  "Tecnología":              { liquidez_corriente: 2.00, endeudamiento: 40, roe: 25, roa: 12, disponibilidad_inmediata: 30, deuda_patrimonio: 0.7 },
  "Comercio":                { liquidez_corriente: 1.30, endeudamiento: 60, roe: 15, roa: 6,  disponibilidad_inmediata: 15, deuda_patrimonio: 1.5 },
  "Manufactura":             { liquidez_corriente: 1.50, endeudamiento: 52, roe: 14, roa: 6,  disponibilidad_inmediata: 15, deuda_patrimonio: 1.1 },
  "Construcción":            { liquidez_corriente: 1.20, endeudamiento: 65, roe: 12, roa: 5,  disponibilidad_inmediata: 10, deuda_patrimonio: 1.8 },
  "Salud":                   { liquidez_corriente: 1.60, endeudamiento: 45, roe: 20, roa: 9,  disponibilidad_inmediata: 25, deuda_patrimonio: 0.8 },
  "Educación":               { liquidez_corriente: 1.50, endeudamiento: 50, roe: 16, roa: 8,  disponibilidad_inmediata: 20, deuda_patrimonio: 1.0 },
  "Transporte":              { liquidez_corriente: 1.20, endeudamiento: 62, roe: 10, roa: 4,  disponibilidad_inmediata: 10, deuda_patrimonio: 1.6 },
  "Gastronomía":             { liquidez_corriente: 1.10, endeudamiento: 65, roe: 18, roa: 7,  disponibilidad_inmediata: 8,  deuda_patrimonio: 1.8 },
  "Seguridad":               { liquidez_corriente: 1.40, endeudamiento: 55, roe: 16, roa: 7,  disponibilidad_inmediata: 18, deuda_patrimonio: 1.2 },
  "Agropecuario":            { liquidez_corriente: 1.40, endeudamiento: 55, roe: 12, roa: 5,  disponibilidad_inmediata: 12, deuda_patrimonio: 1.2 },
  "Energía":                 { liquidez_corriente: 1.60, endeudamiento: 48, roe: 18, roa: 8,  disponibilidad_inmediata: 15, deuda_patrimonio: 0.9 },
  "Otro":                    { liquidez_corriente: 1.40, endeudamiento: 55, roe: 15, roa: 7,  disponibilidad_inmediata: 18, deuda_patrimonio: 1.2 },
};

interface BenchmarksProps {
  sector: string | null;
  indicadores: Record<string, IndicadorConGauge>;
}

// "menor es mejor" para endeudamiento y deuda_patrimonio
const MENOR_MEJOR = new Set(["endeudamiento", "deuda_patrimonio", "concentracion_cxc"]);

function BenchmarksSection({ sector, indicadores }: BenchmarksProps) {
  const ref = sector ? (BENCHMARKS[sector] ?? BENCHMARKS["Otro"]) : BENCHMARKS["Otro"];
  const sectorLabel = sector ?? "Referencia general";

  const filas: { key: keyof BenchmarkSector; nombre: string; fmt: (v: number) => string }[] = [
    { key: "liquidez_corriente",       nombre: "Liquidez Corriente",    fmt: fmt2 },
    { key: "endeudamiento",            nombre: "Endeudamiento",         fmt: fmtP },
    { key: "roe",                      nombre: "ROE",                   fmt: fmtP },
    { key: "roa",                      nombre: "ROA",                   fmt: fmtP },
    { key: "disponibilidad_inmediata", nombre: "Disponibilidad Inm.",   fmt: fmtP },
    { key: "deuda_patrimonio",         nombre: "Deuda / Patrimonio",    fmt: fmt2 },
  ];

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-1">
        <h3 className={HEADER_CLASS}>
          <BarChart2 size={14} className="mr-2.5 text-violet-500" />
          Comparación vs. sector: <span className="text-violet-600 ml-1">{sectorLabel}</span>
        </h3>
        <span className={`${BADGE_BASE} text-[9px] text-zinc-400 px-2 py-0.5`}>Valores de referencia sectorial</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-2 pr-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Indicador</th>
              <th className="text-right py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Empresa</th>
              <th className="text-right py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Ref. Sector</th>
              <th className="text-center py-2 px-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest">Brecha</th>
              <th className="text-center py-2 pl-3 text-[9px] font-bold text-zinc-100 uppercase tracking-widest hidden sm:table-cell">Vs. Sector</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ key, nombre, fmt: fmtFn }) => {
              const ind       = (indicadores as any)[key] as IndicadorConGauge | undefined;
              const empresa   = ind?.valor ?? null;
              const referencia = ref[key];
              const diferencia = empresa !== null ? empresa - referencia : null;
              const menorMejor = MENOR_MEJOR.has(key);
              const esMejor    = diferencia !== null && (menorMejor ? diferencia < 0 : diferencia > 0);
              const esPeor     = diferencia !== null && (menorMejor ? diferencia > 0 : diferencia < 0);
              const brechaLabel = diferencia !== null
                ? `${diferencia > 0 ? "+" : ""}${fmtFn(diferencia)}`
                : "—";
              return (
                <tr key={key} className="border-b border-white/5">
                  <td className="py-2.5 pr-3 font-semibold text-zinc-300">{nombre}</td>
                  <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${empresa === null ? "text-zinc-300" : "text-zinc-200"}`}>
                    {empresa !== null ? fmtFn(empresa) : "N/D"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500 tabular-nums">{fmtFn(referencia)}</td>
                  <td className={`py-2.5 px-3 text-center font-semibold tabular-nums ${
                    diferencia === null ? "text-zinc-300" :
                    esMejor ? "text-emerald-600" :
                    esPeor ? "text-red-500" : "text-zinc-500"
                  }`}>
                    {brechaLabel}
                  </td>
                  <td className="py-2.5 pl-3 text-center hidden sm:table-cell">
                    {diferencia === null ? null : (
                      <span className={`${BADGE_BASE} inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold ${ esMejor ? "bg-emerald-50 text-emerald-700" : esPeor ? "bg-red-50 text-red-600" : "bg-zinc-800 text-zinc-500" }`}>
                        {esMejor ? "↑ Sobre ref." : esPeor ? "↓ Bajo ref." : "= En línea"}
                      </span>
                    )}
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

// ── Export PDF ───────────────────────────────────────────────────

function exportarPDF(empresaNombre: string, periodo: string) {
  const style = document.createElement("style");
  style.id = "__af_print__";
  style.textContent = `
    @media print {
      body > * { visibility: hidden !important; }
      #af-print-root, #af-print-root * { visibility: visible !important; }
      #af-print-root {
        position: fixed; top: 0; left: 0; width: 100%;
        background: white; z-index: 99999;
        padding: 24px; font-size: 11px;
      }
      @page { size: A4 portrait; margin: 10mm; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => document.getElementById("__af_print__")?.remove(), 1000);
}

// ── Panel empresa ────────────────────────────────────────────────

function PanelEmpresa({ empresaId, periodoId }: { empresaId: string; periodoId: string }) {
  const c = useChartColors();
  const [datos,    setDatos]    = useState<AnalisisEmpresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    getAnalisisEmpresa(empresaId, periodoId)
      .then(setDatos)
      .catch(() => setError("No se pudo cargar el análisis."))
      .finally(() => setCargando(false));
  }, [empresaId, periodoId]);

  if (cargando) return <div className="text-center py-20 text-xs text-zinc-500">Calculando indicadores…</div>;
  if (error || !datos) return <div className="text-center py-12 text-xs text-red-500">{error ?? "Error"}</div>;

  const { empresa, periodo, calculado, indicadores: ind, composicion_activos, composicion_pasivos,
          evolucion, hallazgos, recomendaciones, semaforo } = datos;

  const moneda = empresa.moneda;
  const fmtM   = (n: number) => `${moneda} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

  const descs = {
    liquidez: ind.liquidez_corriente.valor !== null
      ? `Por cada ${moneda} 1 de deuda CP, tiene ${moneda} ${ind.liquidez_corriente.valor.toFixed(2)} disponible.`
      : "Sin pasivos corrientes.",
    capital: ind.capital_trabajo.valor !== null
      ? ind.capital_trabajo.valor >= 0
        ? `Capital de trabajo positivo: ${fmtM(ind.capital_trabajo.valor)}.`
        : `Déficit: ${fmtM(Math.abs(ind.capital_trabajo.valor))}.`
      : "Sin datos.",
    endeud:  ind.endeudamiento.valor !== null
      ? `El ${ind.endeudamiento.valor.toFixed(1)}% de activos financiados por terceros.`
      : "Sin datos.",
    deudaP:  ind.deuda_patrimonio.valor !== null
      ? `Por cada ${moneda} 1 propio existen ${moneda} ${ind.deuda_patrimonio.valor.toFixed(2)} de deuda.`
      : "Patrimonio ≤ 0.",
    roe:     ind.roe.valor !== null
      ? `Rentabilidad del patrimonio: ${ind.roe.valor.toFixed(1)}% anual.`
      : "Sin datos.",
    roa:     ind.roa.valor !== null
      ? `Los activos generan ${ind.roa.valor.toFixed(1)}% de retorno anual.`
      : "Sin datos.",
    cxc:     ind.concentracion_cxc.valor !== null
      ? `El ${ind.concentracion_cxc.valor.toFixed(1)}% de activos corrientes son CxC.`
      : "Sin datos.",
    disp:    ind.disponibilidad_inmediata.valor !== null
      ? `El ${ind.disponibilidad_inmediata.valor.toFixed(1)}% de obligaciones CP cubiertas con caja.`
      : "Sin pasivos corrientes.",
  };

  const radarData = [
    { indicador: "Liquidez",     valor: Math.round(ind.liquidez_corriente.gauge_pct * 100) },
    { indicador: "Capital T.",   valor: Math.round(ind.capital_trabajo.gauge_pct * 100) },
    { indicador: "Endeud.",      valor: Math.round(ind.endeudamiento.gauge_pct * 100) },
    { indicador: "D/Patrimonio", valor: Math.round(ind.deuda_patrimonio.gauge_pct * 100) },
    { indicador: "ROE",          valor: Math.round(ind.roe.gauge_pct * 100) },
    { indicador: "ROA",          valor: Math.round(ind.roa.gauge_pct * 100) },
    { indicador: "Conc. CxC",    valor: Math.round(ind.concentracion_cxc.gauge_pct * 100) },
    { indicador: "Disponib.",    valor: Math.round(ind.disponibilidad_inmediata.gauge_pct * 100) },
  ];

  const balanceData = [
    { name: "Activos Tot.",  valor: calculado.activos_totales,         fill: c.palette[1]    },
    { name: "Pasivos Tot.",  valor: calculado.pasivos_totales,         fill: "#f87171"      },
    { name: "Patrimonio",    valor: Number(periodo.patrimonio),         fill: c.accent },
    { name: "Utilidad",      valor: Number(periodo.utilidad_ejercicio), fill: c.success },
  ];

  // Formatear por clave para la tabla
  const formatearPorClave: Record<string, (v: number) => string> = {
    liquidez_corriente:       fmt2,
    capital_trabajo:          fmtM,
    endeudamiento:            fmtP,
    deuda_patrimonio:         fmt2,
    roe:                      fmtP,
    roa:                      fmtP,
    concentracion_cxc:        fmtP,
    disponibilidad_inmediata: fmtP,
  };

  // Castear indicadores para que la tabla funcione con posible margen_neto extra
  const indParaTabla = ind as unknown as Record<string, IndicadorConGauge>;

  return (
    <div id="af-print-root" className="space-y-6">

      {/* Info empresa + período + acciones */}
      <div className={`${CARD_CLASS} flex flex-col sm:flex-row sm:items-center gap-4`}>
        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {empresa.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-zinc-200">{empresa.nombre}</p>
          <p className="text-[11px] text-zinc-500">
            {empresa.sector && `${empresa.sector} · `}{empresa.moneda} · {periodo.periodo}
            {" · "}{new Date(periodo.fecha_periodo).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <SemaforoGeneral semaforo={semaforo} />
          <button
            onClick={() => exportarPDF(empresa.nombre, periodo.periodo)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition print:hidden"
          >
            <Printer size={12} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs balance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Activos Totales",    valor: calculado.activos_totales,          ok: true },
          { label: "Pasivos Totales",    valor: calculado.pasivos_totales,          ok: false },
          { label: "Patrimonio",         valor: Number(periodo.patrimonio),          ok: Number(periodo.patrimonio) >= 0 },
          { label: "Utilidad del Año",   valor: Number(periodo.utilidad_ejercicio),  ok: Number(periodo.utilidad_ejercicio) >= 0 },
          { label: "Activos Corrientes", valor: calculado.activos_corrientes,        ok: true },
          { label: "Pasivos Corrientes", valor: calculado.pasivos_corrientes,        ok: false },
          { label: "Caja y Bancos",      valor: Number(periodo.caja_bancos),         ok: true },
          { label: "Cuentas x Cobrar",   valor: Number(periodo.cuentas_por_cobrar),  ok: true },
        ].map(({ label, valor, ok }) => (
          <div key={label} className={CARD_CLASS}>
            <p className="text-[10px] text-zinc-100 uppercase tracking-wider font-semibold mb-1.5">{label}</p>
            <p className={`text-base font-extrabold tracking-tight ${ok ? "text-zinc-100" : "text-red-500"}`}>
              {fmtM(valor)}
            </p>
          </div>
        ))}
      </div>

      {/* 8 Gauges velocímetro */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-widest mb-4 flex items-center gap-2">
          Dashboard de 8 indicadores clave
          <span className="flex gap-1.5 items-center text-[9px] normal-case font-normal text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> Crítico
            <span className="w-2 h-2 rounded-full bg-yellow-200 inline-block ml-1" /> Moderado
            <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block ml-1" /> Óptimo
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GaugeCard numero={1} titulo="Liquidez Corriente"     indicador={ind.liquidez_corriente}       formatear={fmt2}  Icon={Droplets}   descripcion={descs.liquidez} />
          <GaugeCard numero={2} titulo="Capital de Trabajo"     indicador={ind.capital_trabajo}          formatear={fmtM}  Icon={Wallet}     descripcion={descs.capital} />
          <GaugeCard numero={3} titulo="Endeudamiento"          indicador={ind.endeudamiento}            formatear={fmtP}  Icon={PieIcon}    descripcion={descs.endeud} />
          <GaugeCard numero={4} titulo="Deuda / Patrimonio"     indicador={ind.deuda_patrimonio}         formatear={fmt2}  Icon={Scale}      descripcion={descs.deudaP} />
          <GaugeCard numero={5} titulo="ROE (Rent. Patrimonio)" indicador={ind.roe}                      formatear={fmtP}  Icon={TrendingUp} descripcion={descs.roe} />
          <GaugeCard numero={6} titulo="ROA (Rent. Activos)"    indicador={ind.roa}                      formatear={fmtP}  Icon={BarChart2}  descripcion={descs.roa} />
          <GaugeCard numero={7} titulo="Concentración CxC"      indicador={ind.concentracion_cxc}        formatear={fmtP}  Icon={Users}      descripcion={descs.cxc} />
          <GaugeCard numero={8} titulo="Disponibilidad Inm."    indicador={ind.disponibilidad_inmediata} formatear={fmtP}  Icon={Banknote}   descripcion={descs.disp} />
        </div>
      </div>

      {/* Tabla de interpretación */}
      <TablaInterpretacion indicadores={indParaTabla} formatearPorClave={formatearPorClave} />

      {/* Benchmarks sectoriales */}
      <BenchmarksSection sector={empresa.sector} indicadores={indParaTabla} />

      {/* Radar + Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}>
            <Activity size={14} className="mr-2.5 text-zinc-500" />
            Visión global — 8 indicadores (0–100 normalizado)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f4f4f5" />
              <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 10, fill: "#71717a" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#a1a1aa" }} tickCount={3} />
              <Radar filter="url(#neon-glow)" name="Score" dataKey="valor" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2} />
              <ReTooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className={`${TOOLTIP_BASE} px-3 py-1.5 text-xs`}>
                    <p className="font-semibold text-zinc-300">{d.payload?.indicador}</p>
                    <p className="text-zinc-500">Score: {d.value}/100</p>
                  </div>
                );
              }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}>
            <BarChart2 size={14} className="mr-2.5 text-zinc-500" />
            Estructura financiera
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={balanceData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipSimple />} />
              <Bar filter="url(#neon-glow)" dataKey="valor" name="Valor" radius={[6, 6, 0, 0]}>
                {balanceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composición activos + pasivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><PieIcon size={14} className="mr-2.5 text-zinc-500" />Composición de Activos</h3>
          {composicion_activos.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie filter="url(#neon-glow)" data={composicion_activos} dataKey="porcentaje" nameKey="nombre"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {composicion_activos.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip content={<DonutTooltip />} />
                  <Legend formatter={v => <span className="text-[10px] text-zinc-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {composicion_activos.map(c => (
                  <div key={c.nombre} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      <span className="text-zinc-500">{c.nombre}</span>
                    </div>
                    <span className="font-semibold text-zinc-300">{c.porcentaje.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-zinc-400 text-center py-8">Sin datos</p>}
        </div>

        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><Scale size={14} className="mr-2.5 text-zinc-500" />Composición de Pasivos</h3>
          {composicion_pasivos.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie filter="url(#neon-glow)" data={composicion_pasivos} dataKey="porcentaje" nameKey="nombre"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {composicion_pasivos.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip content={<DonutTooltip />} />
                  <Legend formatter={v => <span className="text-[10px] text-zinc-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {composicion_pasivos.map(c => (
                  <div key={c.nombre} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      <span className="text-zinc-500">{c.nombre}</span>
                    </div>
                    <span className="font-semibold text-zinc-300">{c.porcentaje.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-zinc-400 text-center py-8">Sin pasivos registrados</p>}
        </div>
      </div>

      {/* Evolución (2+ períodos) */}
      {evolucion.length >= 2 && (
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}>
            <TrendingUp size={14} className="mr-2.5 text-emerald-500" />
            Evolución de indicadores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolucion} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v?.toFixed(0) ?? 0}`} />
              <Tooltip content={<TooltipSimple />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="liquidez_corriente" name="Liquidez"   stroke={c.accent}   strokeWidth={2} dot={{ r: 3 }} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="endeudamiento"       name="Endeud. %" stroke="#f87171"           strokeWidth={2} dot={{ r: 3 }} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="roe"                 name="ROE %"     stroke={c.success}   strokeWidth={2} dot={{ r: 3 }} />
              <Line filter="url(#neon-glow)" type="monotone" dataKey="disponibilidad"      name="Disp. %"   stroke={c.palette[3]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Hallazgos + Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><span className="w-2 h-2 rounded-full bg-zinc-400 mr-2.5 inline-block" />Hallazgos Principales</h3>
          <ul className="space-y-2.5">
            {hallazgos.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                {h.tipo === "positivo"
                  ? <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <XCircle     size={13} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <span>{h.texto}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><span className="w-2 h-2 rounded-full bg-amber-400 mr-2.5 inline-block" />Recomendaciones</h3>
          <ol className="space-y-3">
            {recomendaciones.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed flex-1">{r}</p>
                <ChevronRight size={11} className="text-zinc-300 mt-0.5 flex-shrink-0" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── Panel análisis interno ───────────────────────────────────────

function PanelInterno() {
  const c = useChartColors();
  const [datos,    setDatos]    = useState<AnalisisFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(null);
    getAnalisisFinanciero()
      .then(setDatos)
      .catch(() => setError("No se pudo cargar el análisis."))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) return <div className="flex items-center justify-center h-64 text-xs text-zinc-500">Calculando indicadores…</div>;
  if (error || !datos) return <div className="text-center py-16 text-xs text-red-500">{error ?? "Error"}</div>;

  const { resumen, indicadores: ind, composicion_activos, hallazgos, recomendaciones, semaforo, fecha_analisis } = datos;
  const fecha = new Date(fecha_analisis).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

  const indicadoresConGauge = {
    liquidez_corriente:       { ...ind.liquidez_corriente,       gauge_pct: Math.min(1, (ind.liquidez_corriente.valor ?? 0) / 3) },
    capital_trabajo:          { ...ind.capital_trabajo,          gauge_pct: ind.capital_trabajo.valor !== null ? Math.min(1, Math.max(0, 0.5 + ind.capital_trabajo.valor / (Math.abs(ind.capital_trabajo.valor) * 4 || 1) * 0.5)) : 0 },
    endeudamiento:            { ...ind.endeudamiento,            gauge_pct: Math.max(0, 1 - (ind.endeudamiento.valor ?? 100) / 100) },
    deuda_patrimonio:         { ...ind.deuda_patrimonio,         gauge_pct: ind.deuda_patrimonio.valor !== null ? Math.max(0, 1 - ind.deuda_patrimonio.valor / 4) : 0 },
    roe:                      { ...ind.roe,                      gauge_pct: Math.min(1, Math.max(0, (ind.roe.valor ?? 0) / 50)) },
    roa:                      { ...ind.roa,                      gauge_pct: Math.min(1, Math.max(0, (ind.roa.valor ?? 0) / 30)) },
    concentracion_cxc:        { ...ind.concentracion_cxc,        gauge_pct: Math.max(0, 1 - (ind.concentracion_cxc.valor ?? 100) / 100) },
    disponibilidad_inmediata: { ...ind.disponibilidad_inmediata, gauge_pct: Math.min(1, (ind.disponibilidad_inmediata.valor ?? 0) / 100) },
  };

  const radarData = [
    { indicador: "Liquidez",     valor: Math.round(indicadoresConGauge.liquidez_corriente.gauge_pct * 100) },
    { indicador: "Capital T.",   valor: Math.round(indicadoresConGauge.capital_trabajo.gauge_pct * 100) },
    { indicador: "Endeud.",      valor: Math.round(indicadoresConGauge.endeudamiento.gauge_pct * 100) },
    { indicador: "D/Patrimonio", valor: Math.round(indicadoresConGauge.deuda_patrimonio.gauge_pct * 100) },
    { indicador: "ROE",          valor: Math.round(indicadoresConGauge.roe.gauge_pct * 100) },
    { indicador: "ROA",          valor: Math.round(indicadoresConGauge.roa.gauge_pct * 100) },
    { indicador: "Conc. CxC",    valor: Math.round(indicadoresConGauge.concentracion_cxc.gauge_pct * 100) },
    { indicador: "Disponib.",    valor: Math.round(indicadoresConGauge.disponibilidad_inmediata.gauge_pct * 100) },
  ];

  const formatearPorClave: Record<string, (v: number) => string> = {
    liquidez_corriente:       fmt2,
    capital_trabajo:          fmt,
    endeudamiento:            fmtP,
    deuda_patrimonio:         fmt2,
    roe:                      fmtP,
    roa:                      fmtP,
    concentracion_cxc:        fmtP,
    disponibilidad_inmediata: fmtP,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">Al {fecha} · Calculado desde ingresos, egresos y préstamos registrados</p>
        <button onClick={cargar} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Activos Totales",  valor: resumen.activos_totales,    ok: true },
          { label: "Pasivos Totales",  valor: resumen.pasivos_totales,    ok: false },
          { label: "Patrimonio",       valor: resumen.patrimonio,         ok: resumen.patrimonio >= 0 },
          { label: "Utilidad del Año", valor: resumen.utilidad_ejercicio, ok: resumen.utilidad_ejercicio >= 0 },
          { label: "Caja y Bancos",    valor: resumen.caja_bancos,        ok: resumen.caja_bancos >= 0 },
        ].map(({ label, valor, ok }) => (
          <div key={label} className={CARD_CLASS}>
            <p className="text-[10px] text-zinc-100 uppercase tracking-wider font-semibold mb-1.5">{label}</p>
            <p className={`text-base font-extrabold tracking-tight ${ok ? "text-zinc-100" : "text-red-500"}`}>{fmt(valor)}</p>
          </div>
        ))}
      </div>

      {/* 8 Gauges */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-widest mb-4 flex items-center gap-2">
          Dashboard de 8 indicadores clave
          <span className="flex gap-1.5 items-center text-[9px] normal-case font-normal text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> Crítico
            <span className="w-2 h-2 rounded-full bg-yellow-200 inline-block ml-1" /> Moderado
            <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block ml-1" /> Óptimo
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GaugeCard numero={1} titulo="Liquidez Corriente"     indicador={indicadoresConGauge.liquidez_corriente}       formatear={fmt2}  Icon={Droplets}   descripcion={`Por cada S/1 de deuda CP, tienes S/${indicadoresConGauge.liquidez_corriente.valor?.toFixed(2) ?? "0"}.`} />
          <GaugeCard numero={2} titulo="Capital de Trabajo"     indicador={indicadoresConGauge.capital_trabajo}          formatear={fmt}   Icon={Wallet}     descripcion={indicadoresConGauge.capital_trabajo.valor !== null && indicadoresConGauge.capital_trabajo.valor >= 0 ? "Capital positivo — operación cubierta." : "Capital negativo — déficit."} />
          <GaugeCard numero={3} titulo="Endeudamiento"          indicador={indicadoresConGauge.endeudamiento}            formatear={fmtP}  Icon={PieIcon}    descripcion={`${indicadoresConGauge.endeudamiento.valor?.toFixed(1) ?? 0}% de activos financiados por terceros.`} />
          <GaugeCard numero={4} titulo="Deuda / Patrimonio"     indicador={indicadoresConGauge.deuda_patrimonio}         formatear={fmt2}  Icon={Scale}      descripcion={indicadoresConGauge.deuda_patrimonio.valor !== null ? `S/${indicadoresConGauge.deuda_patrimonio.valor.toFixed(2)} de deuda por cada S/1 propio.` : "No aplica."} />
          <GaugeCard numero={5} titulo="ROE (Rent. Patrimonio)" indicador={indicadoresConGauge.roe}                      formatear={fmtP}  Icon={TrendingUp} descripcion={indicadoresConGauge.roe.valor !== null ? `Retorno sobre patrimonio: ${indicadoresConGauge.roe.valor.toFixed(1)}% anual.` : "Sin datos."} />
          <GaugeCard numero={6} titulo="ROA (Rent. Activos)"    indicador={indicadoresConGauge.roa}                      formatear={fmtP}  Icon={BarChart2}  descripcion={indicadoresConGauge.roa.valor !== null ? `Activos generan ${indicadoresConGauge.roa.valor.toFixed(1)}% de retorno.` : "Sin datos."} />
          <GaugeCard numero={7} titulo="Concentración CxC"      indicador={indicadoresConGauge.concentracion_cxc}        formatear={fmtP}  Icon={Users}      descripcion={`${indicadoresConGauge.concentracion_cxc.valor?.toFixed(1) ?? 0}% de activos corrientes en CxC.`} />
          <GaugeCard numero={8} titulo="Disponibilidad Inm."    indicador={indicadoresConGauge.disponibilidad_inmediata} formatear={fmtP}  Icon={Banknote}   descripcion={`${indicadoresConGauge.disponibilidad_inmediata.valor?.toFixed(1) ?? 0}% de obligaciones CP cubiertas con caja.`} />
        </div>
      </div>

      {/* Tabla de interpretación */}
      <TablaInterpretacion indicadores={indicadoresConGauge as unknown as Record<string, IndicadorConGauge>} formatearPorClave={formatearPorClave} />

      {/* Radar + Composición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><Activity size={14} className="mr-2.5 text-zinc-500" />Visión global (0–100 normalizado)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f4f4f5" />
              <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 10, fill: "#71717a" }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#a1a1aa" }} tickCount={3} />
              <Radar filter="url(#neon-glow)" name="Score" dataKey="valor" stroke={c.accent} fill={c.accent} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><PieIcon size={14} className="mr-2.5 text-zinc-500" />Composición de Activos</h3>
          {composicion_activos.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie filter="url(#neon-glow)" data={composicion_activos} dataKey="porcentaje" nameKey="nombre"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {composicion_activos.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <ReTooltip content={<DonutTooltip />} />
                  <Legend formatter={v => <span className="text-[10px] text-zinc-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {composicion_activos.map(c => (
                  <div key={c.nombre} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      <span className="text-zinc-500">{c.nombre}</span>
                    </div>
                    <span className="font-semibold text-zinc-300">{c.porcentaje.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-zinc-400 text-center py-8">Sin datos</p>}
        </div>
      </div>

      {/* Semáforo + Hallazgos + Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SemaforoGeneral semaforo={semaforo} />
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><span className="w-2 h-2 rounded-full bg-zinc-400 mr-2.5 inline-block" />Hallazgos</h3>
          <ul className="space-y-2">
            {hallazgos.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
                {h.tipo === "positivo"
                  ? <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <XCircle     size={13} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <span>{h.texto}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={CARD_CLASS}>
          <h3 className={HEADER_CLASS}><span className="w-2 h-2 rounded-full bg-amber-400 mr-2.5 inline-block" />Recomendaciones</h3>
          <ol className="space-y-3">
            {recomendaciones.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{r}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────

export default function AnalisisFinancieroPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"interno" | "empresa">(() =>
    searchParams.get("empresa") ? "empresa" : "interno"
  );
  const [empresas,  setEmpresas]  = useState<EmpresaAnalisis[]>([]);
  const [periodos,  setPeriodos]  = useState<PeriodoFinanciero[]>([]);
  const [empresaId, setEmpresaId] = useState<string>(searchParams.get("empresa") ?? "");
  const [periodoId, setPeriodoId] = useState<string>(searchParams.get("periodo") ?? "");

  useEffect(() => { getEmpresas().then(setEmpresas).catch(() => {}); }, []);

  useEffect(() => {
    if (!empresaId) { setPeriodos([]); setPeriodoId(""); return; }
    getPeriodos(empresaId).then(p => {
      setPeriodos(p);
      if (!periodoId && p.length > 0) setPeriodoId(p[0].id);
    }).catch(() => {});
  }, [empresaId]);

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    setPeriodoId("");
    setSearchParams(id ? { empresa: id } : {});
  };

  const handlePeriodoChange = (id: string) => {
    setPeriodoId(id);
    if (empresaId) setSearchParams({ empresa: empresaId, periodo: id });
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Análisis Financiero</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Ratios, indicadores y lectura financiera basada en datos reales</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg w-fit">
        {([
          { value: "interno" as const, label: "Mis Finanzas"  },
          { value: "empresa" as const, label: "Por Empresa"   },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 text-xs rounded-md transition ${
              tab === t.value ? "bg-slate-800/60 shadow-sm text-zinc-200 font-medium" : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Selectores empresa */}
      {tab === "empresa" && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">Empresa</label>
            <select
              value={empresaId}
              onChange={e => handleEmpresaChange(e.target.value)}
              className={`${INPUT_BASE} px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 min-w-[200px]`}
            >
              <option value="">Seleccionar empresa…</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          {empresaId && periodos.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">Período</label>
              <select
                value={periodoId}
                onChange={e => handlePeriodoChange(e.target.value)}
                className={`${INPUT_BASE} px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 min-w-[160px]`}
              >
                {periodos.map(p => (
                  <option key={p.id} value={p.id}>{p.periodo}</option>
                ))}
              </select>
            </div>
          )}
          {empresaId && periodos.length === 0 && (
            <p className="text-xs text-zinc-400 pb-2">Sin períodos. Ve a Finanzas → Empresas.</p>
          )}
        </div>
      )}

      {/* Contenido */}
      {tab === "interno" && <PanelInterno />}

      {tab === "empresa" && !empresaId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 size={40} className="text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-400">Selecciona una empresa para ver su análisis</p>
          <p className="text-xs text-zinc-400 mt-1">Registra empresas en Finanzas → Empresas</p>
        </div>
      )}

      {tab === "empresa" && empresaId && periodoId && (
        <PanelEmpresa empresaId={empresaId} periodoId={periodoId} />
      )}
    </div>
  );
}
