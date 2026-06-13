/** client/src/components/inteligencia/RegionInteligente.tsx */

import { useState } from "react";
import { COLORS, CARD_CLASS, BADGE_BASE } from "../../lib/tokens";
import { MapPin, X, Flame, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import type { RegionEtapa } from "../../services/prospectos.api";
import { PeruMap, normalizeRegion } from "../ui/PeruMap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

function normalize(s: string): string { return normalizeRegion(s); }

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}
function fmtVal(n: number): string {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `S/ ${(n / 1_000).toFixed(1)}k`;
  if (n > 0)          return `S/ ${n}`;
  return "—";
}

function colorVolumen(total: number, maxTotal: number): string {
  if (total === 0) return "#f4f4f5";
  const r = total / maxTotal;
  if (r >= 0.6)  return COLORS.dark;
  if (r >= 0.3)  return COLORS.mutedDark;
  if (r >= 0.1)  return "#71717a";
  if (r >= 0.02) return "#a1a1aa";
  return "#d4d4d8";
}

function colorConversion(tasa: number, hasData: boolean): string {
  if (!hasData) return "#f4f4f5";
  if (tasa === 0) return "#d4d4d8";
  if (tasa >= 15) return COLORS.primary;
  if (tasa >= 8)  return COLORS.dark;
  if (tasa >= 3)  return COLORS.mutedDark;
  return "#a1a1aa";
}

// ── Scoring ───────────────────────────────────────────────────────────────────
interface ScoreRegion {
  region:   RegionEtapa;
  score:    number;
  motivos:  string[];
}

function calcularScores(data: RegionEtapa[]): ScoreRegion[] {
  const con = data.filter(d => d.llamadas > 0);
  if (!con.length) return [];
  const maxL = Math.max(...con.map(d => d.llamadas), 1);
  const maxR = Math.max(...con.map(d => d.reuniones), 1);
  const maxP = Math.max(...con.map(d => d.propuestas), 1);
  const maxB = Math.max(...con.map(d => d.brochures ?? 0), 1);

  return con.map(d => {
    const tc = pct(d.llamadas_contestadas, d.llamadas);
    const rn = (d.reuniones / maxR) * 100;
    const pn = (d.propuestas / maxP) * 100;
    const bn = ((d.brochures ?? 0) / maxB) * 100;
    const vl = (d.llamadas / maxL) * 100;
    const score = Math.round(tc * 0.35 + rn * 0.25 + pn * 0.2 + bn * 0.1 + vl * 0.1);
    const motivos: string[] = [];
    if (tc >= 60)                motivos.push(`${tc}% contesta llamadas`);
    if (d.reuniones > 0)         motivos.push(`${d.reuniones} reunión${d.reuniones > 1 ? "es" : ""}`);
    if ((d.brochures ?? 0) > 0)  motivos.push(`${d.brochures} brochure${(d.brochures ?? 0) > 1 ? "s" : ""} enviados`);
    if (d.propuestas > 0)        motivos.push(`${d.propuestas} propuesta${d.propuestas > 1 ? "s" : ""}`);
    return { region: d, score, motivos };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

// Regiones con baja penetración pero buena tasa de contacto — "sin explotar"
function calcularOportunidades(data: RegionEtapa[]): ScoreRegion[] {
  const con = data.filter(d => d.llamadas > 0);
  if (con.length < 4) return [];

  const totales = con.map(d => d.total).sort((a, b) => a - b);
  const mediana  = totales[Math.floor(totales.length / 2)];
  const avgContacto = Math.round(
    con.reduce((s, d) => s + pct(d.llamadas_contestadas, d.llamadas), 0) / con.length
  );

  return con
    .filter(d => d.total <= mediana && pct(d.llamadas_contestadas, d.llamadas) > avgContacto)
    .map(d => {
      const tc = pct(d.llamadas_contestadas, d.llamadas);
      const penetracion = Math.round((1 - d.total / (mediana || 1)) * 100);
      const score = Math.round(tc * 0.55 + penetracion * 0.45);
      const motivos: string[] = [
        `${tc}% de contacto (prom. ${avgContacto}%)`,
        `Solo ${d.total} leads — baja exploración`,
      ];
      if (d.propuestas_ganadas > 0)
        motivos.push(`${d.propuestas_ganadas} cierre${d.propuestas_ganadas > 1 ? "s" : ""} logrado${d.propuestas_ganadas > 1 ? "s" : ""}`);
      return { region: d, score, motivos };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ── Embudo de conversión ──────────────────────────────────────────────────────
function EmbудоConversion({ d, todos }: { d: RegionEtapa; todos: RegionEtapa[] }) {
  const promLlamadas   = todos.reduce((s, x) => s + x.llamadas, 0) / (todos.length || 1);
  const promContest    = todos.reduce((s, x) => s + x.llamadas_contestadas, 0) / (todos.length || 1);
  const promBrochures  = todos.reduce((s, x) => s + (x.brochures ?? 0), 0) / (todos.length || 1);
  const promReuniones  = todos.reduce((s, x) => s + x.reuniones, 0) / (todos.length || 1);
  const promPropuestas = todos.reduce((s, x) => s + x.propuestas, 0) / (todos.length || 1);
  const promGanadas    = todos.reduce((s, x) => s + x.propuestas_ganadas, 0) / (todos.length || 1);

  const etapas = [
    { label: "Leads",       region: d.total,                prom: todos.reduce((s,x)=>s+x.total,0)/todos.length, color: COLORS.dark      },
    { label: "Llamadas",    region: d.llamadas,             prom: promLlamadas,   color: COLORS.primary      },
    { label: "Contestadas", region: d.llamadas_contestadas, prom: promContest,    color: COLORS.mutedDark },
    { label: "Brochures",   region: d.brochures ?? 0,       prom: promBrochures,  color: COLORS.primary     },
    { label: "Reuniones",   region: d.reuniones,            prom: promReuniones,  color: COLORS.muted   },
    { label: "Propuestas",  region: d.propuestas,           prom: promPropuestas, color: COLORS.primary   },
    { label: "Ganadas",     region: d.propuestas_ganadas,   prom: promGanadas,    color: COLORS.primary   },
  ];

  return (
    <div className="mt-5 pt-5 border-t border-white/8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">
          Embudo de conversión — <span className="capitalize text-zinc-300">{d.zona.replace(/_/g," ")}</span>
        </p>
        <div className="flex items-center gap-3 text-[9px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500 inline-block"/>Región</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-zinc-700 inline-block"/>Promedio</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={etapas} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
            formatter={((val: any, name: any) => [val, name === "region" ? "Esta región" : "Promedio"]) as any}
          />
          <Bar filter="url(#neon-glow)" dataKey="region" name="region" radius={[3,3,0,0]} maxBarSize={30}>
            {etapas.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Bar>
          <Bar filter="url(#neon-glow)" dataKey="prom" name="prom" fill={COLORS.surface} radius={[3,3,0,0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Radar de eficiencia ───────────────────────────────────────────────────────
function RadarEficiencia({ d, todos }: { d: RegionEtapa; todos: RegionEtapa[] }) {
  const max = (fn: (x: RegionEtapa) => number) => Math.max(...todos.map(fn), 1);

  const radarData = [
    { metrica: "Contacto",    valor: pct(d.llamadas_contestadas, d.llamadas),    avg: Math.round(todos.reduce((s,x) => s + pct(x.llamadas_contestadas, x.llamadas), 0) / todos.length) },
    { metrica: "Brochures",   valor: Math.round(((d.brochures ?? 0) / max(x => x.brochures ?? 0)) * 100),  avg: 50 },
    { metrica: "Reuniones",   valor: Math.round((d.reuniones   / max(x => x.reuniones))   * 100),           avg: 50 },
    { metrica: "Propuestas",  valor: Math.round((d.propuestas  / max(x => x.propuestas))  * 100),           avg: 50 },
    { metrica: "Cierre",      valor: pct(d.propuestas_ganadas, d.propuestas),                                avg: Math.round(todos.reduce((s,x) => s + pct(x.propuestas_ganadas, x.propuestas), 0) / todos.length) },
    { metrica: "Volumen",     valor: Math.round((d.total       / max(x => x.total))       * 100),           avg: 50 },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-white/8">
      <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider mb-2">
        Radar de eficiencia vs promedio
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#f4f4f5" />
          <PolarAngleAxis dataKey="metrica" tick={{ fontSize: 9, fill: "#71797a" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar filter="url(#neon-glow)" name="Promedio" dataKey="avg" stroke={COLORS.surface} fill={COLORS.dark} fillOpacity={0.5} />
          <Radar filter="url(#neon-glow)" name="Región" dataKey="valor" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.25} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }}
            formatter={((val: any, name: any) => [`${val}%`, name]) as any}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Insight automático ────────────────────────────────────────────────────────
function InsightRegion({ d }: { d: RegionEtapa }) {
  const tc    = pct(d.llamadas_contestadas, d.llamadas);
  const tr    = pct(d.reuniones, d.llamadas_contestadas);
  const tp    = pct(d.propuestas, d.reuniones);
  const tg    = pct(d.propuestas_ganadas, d.propuestas);

  const insights: { tipo: "ok" | "warn"; texto: string }[] = [];

  if (tc >= 60) insights.push({ tipo: "ok",   texto: `Alta tasa de contacto (${tc}%) — los leads de esta región atienden bien las llamadas.` });
  else if (d.llamadas > 0) insights.push({ tipo: "warn", texto: `Baja tasa de contacto (${tc}%) — considera cambiar el horario de llamada.` });

  if ((d.brochures ?? 0) === 0 && d.llamadas_contestadas > 0)
    insights.push({ tipo: "warn", texto: `Ningún brochure enviado pese a tener ${d.llamadas_contestadas} contactos — oportunidad de nutrición.` });
  else if ((d.brochures ?? 0) > 0)
    insights.push({ tipo: "ok", texto: `${d.brochures} brochures enviados — buena cobertura de material.` });

  if (tr >= 30) insights.push({ tipo: "ok",   texto: `${tr}% de contactados acepta reunión — señal de alto interés.` });
  else if (d.reuniones === 0 && d.llamadas_contestadas > 3)
    insights.push({ tipo: "warn", texto: `Sin reuniones pese a ${d.llamadas_contestadas} contactos — intenta agendar en la próxima llamada.` });

  if (tg >= 50) insights.push({ tipo: "ok",   texto: `Tasa de cierre del ${tg}% en propuestas — región muy rentable.` });
  else if (d.propuestas > 0 && d.propuestas_ganadas === 0)
    insights.push({ tipo: "warn", texto: `${d.propuestas} propuestas sin ningún cierre — revisa el precio o el fit.` });

  if (!insights.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
      <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-wider">Diagnóstico</p>
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${ins.tipo === "ok" ? "bg-green-50" : "bg-amber-50"}`}>
          {ins.tipo === "ok"
            ? <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
            : <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
          }
          <p className="text-[10px] text-zinc-400 leading-relaxed">{ins.texto}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
type Modo = "volumen" | "conversion";
type VistaRec = "activas" | "oportunidad";

const LEYENDA_VOLUMEN = [
  { color: COLORS.dark,      label: "Alta concentración" },
  { color: COLORS.mutedDark, label: "Media" },
  { color: "#71717a",        label: "Baja" },
  { color: "#d4d4d8",        label: "Muy baja" },
  { color: "#f4f4f5",        label: "Sin leads" },
];

const LEYENDA_CONV = [
  { color: COLORS.primary,   label: "≥ 15%  Excelente" },
  { color: COLORS.dark,      label: "8–15%  Bueno" },
  { color: COLORS.mutedDark, label: "3–8%   Promedio" },
  { color: "#a1a1aa",        label: "< 3%   Bajo" },
  { color: "#f4f4f5",        label: "Sin datos" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export function RegionInteligente({ data }: { data: RegionEtapa[] }) {
  const [selected,    setSelected]    = useState<RegionEtapa | null>(null);
  const [modo,        setModo]        = useState<Modo>("volumen");
  const [vistaRec,    setVistaRec]    = useState<VistaRec>("activas");

  if (!data.length) return (
    <div className={CARD_CLASS}>
      <p className="text-xs text-zinc-500 text-center py-8">
        Sin datos de región — completa los campos región o ciudad en los prospectos
      </p>
    </div>
  );

  const maxTotal  = Math.max(...data.map(d => d.total), 1);
  const topRegion = data[0];
  const mejorConv = data.reduce(
    (best, d) => d.cerrados > 0 && pct(d.cerrados, d.total) > pct(best.cerrados, best.total) ? d : best,
    data[0]
  );

  const dataMap = new Map<string, RegionEtapa>();
  for (const d of data) dataMap.set(normalize(d.zona), d);

  const recomendadas  = calcularScores(data);
  const oportunidades = calcularOportunidades(data);
  const recsActivas   = vistaRec === "activas" ? recomendadas : oportunidades;

  function getFill(norm: string): string {
    const d = dataMap.get(norm);
    if (!d) return "#f4f4f5";
    return modo === "volumen"
      ? colorVolumen(d.total, maxTotal)
      : colorConversion(pct(d.cerrados, d.total), d.total > 0);
  }

  function handleSelectRegion(normName: string) {
    const d = dataMap.get(normName);
    if (!d) return;
    setSelected(prev => prev?.zona === d.zona ? null : d);
  }

  return (
    <div className={CARD_CLASS}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-zinc-500" strokeWidth={2} />
          <div>
            <p className="text-[11px] font-semibold text-zinc-100 uppercase tracking-wider">Análisis estratégico por región</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Embudo · Eficiencia · Diagnóstico · Clic para detalle</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="text-right">
            <p className="text-[9px] text-zinc-100 uppercase tracking-wider">Mayor volumen</p>
            <p className="text-[12px] font-bold text-zinc-200 capitalize">{topRegion.zona.replace(/_/g," ")}</p>
            <p className="text-[10px] text-zinc-500">{topRegion.total} leads</p>
          </div>
          {mejorConv.cerrados > 0 && (
            <div className="text-right">
              <p className="text-[9px] text-zinc-100 uppercase tracking-wider">Mejor conversión</p>
              <p className="text-[12px] font-bold text-zinc-200 capitalize">{mejorConv.zona.replace(/_/g," ")}</p>
              <p className="text-[10px] text-zinc-500">{pct(mejorConv.cerrados, mejorConv.total)}% cierre</p>
            </div>
          )}
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-[10px] font-semibold">
            {(["volumen","conversion"] as Modo[]).map(m => (
              <button key={m} onClick={() => setModo(m)}
                className={`px-3 py-1.5 transition-colors ${modo === m ? "bg-zinc-900 text-white" : "bg-slate-800/60 text-zinc-500 hover:bg-zinc-800/40"}`}>
                {m === "volumen" ? "Volumen" : "Conversión"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Regiones recomendadas ── */}
      {(recomendadas.length > 0 || oportunidades.length > 0) && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            <Flame size={12} className="text-amber-500" />
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Regiones prioritarias para atacar</p>
            <div className="ml-auto flex rounded-lg border border-amber-200 overflow-hidden text-[9px] font-semibold">
              <button
                onClick={() => setVistaRec("activas")}
                className={`px-2.5 py-1 transition-colors ${vistaRec === "activas" ? "bg-amber-500 text-white" : "bg-slate-800/60 text-amber-600 hover:bg-amber-50"}`}
              >
                Más activas
              </button>
              <button
                onClick={() => setVistaRec("oportunidad")}
                className={`px-2.5 py-1 transition-colors ${vistaRec === "oportunidad" ? "bg-amber-500 text-white" : "bg-slate-800/60 text-amber-600 hover:bg-amber-50"}`}
              >
                Sin explotar
              </button>
            </div>
            <TrendingUp size={11} className="text-amber-500" />
          </div>

          {recsActivas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {recsActivas.map((s, i) => (
                  <button key={s.region.zona}
                    onClick={() => handleSelectRegion(normalize(s.region.zona))}
                    className="text-left p-2.5 rounded-lg bg-slate-800/60 border border-amber-100 hover:border-amber-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-zinc-200 capitalize">
                        {MEDAL[i]} {s.region.zona.replace(/_/g," ")}
                      </span>
                      <span className={`${BADGE_BASE} text-[10px] font-bold text-amber-600 px-1.5 py-0.5`}>{s.score}pts</span>
                    </div>
                    {s.motivos.map(m => <p key={m} className="text-[9px] text-zinc-500">· {m}</p>)}
                    <div className="mt-2 w-full bg-amber-100 rounded-full h-1">
                      <div className="h-1 rounded-full bg-amber-500" style={{ width: `${s.score}%` }} />
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-amber-600 mt-2">
                {vistaRec === "activas"
                  ? "Score = contacto 35% + reuniones 25% + propuestas 20% + brochures 10% + volumen 10%"
                  : "Score = tasa de contacto 55% + baja penetración 45% · regiones con pocos leads pero buena receptividad"}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-amber-600 text-center py-2">
              No hay suficientes datos para identificar oportunidades sin explotar
            </p>
          )}
        </div>
      )}

      {/* ── Mapa + Panel ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        <div className="flex-1 min-w-0 h-[420px] sm:h-[520px] lg:h-[640px]">
          <PeruMap
            getColor={getFill}
            markers={Array.from(dataMap.entries())
              .filter(([, d]) => d.total > 0)
              .map(([normName, d]) => ({ zona: normName, value: d.total }))}
            selected={selected ? normalizeRegion(selected.zona) : undefined}
            selectColor={COLORS.primary}
            onSelect={handleSelectRegion}
            height="100%"
          />
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 pt-1">

          {selected ? (
            <div className="border border-white/10 rounded-xl p-3 space-y-3 overflow-y-auto max-h-[640px]">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-zinc-200 capitalize">{selected.zona.replace(/_/g," ")}</p>
                <button onClick={() => setSelected(null)}>
                  <X size={13} className="text-zinc-400 hover:text-zinc-300" />
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total leads",   value: selected.total,                   color: "text-zinc-800" },
                  { label: "Activos",       value: selected.activos,                 color: "text-blue-600" },
                  { label: "Cerrados",      value: selected.cerrados,                color: "text-green-600" },
                  { label: "Tasa cierre",   value: `${pct(selected.cerrados,selected.total)}%`, color: "text-brand" },
                ].map(k => (
                  <div key={k.label} className="bg-zinc-800/40 rounded-lg px-2.5 py-2">
                    <p className="text-[9px] text-zinc-100 uppercase">{k.label}</p>
                    <p className={`text-[16px] font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Tasas de conversión por etapa */}
              <div className="border-t border-white/8 pt-2.5">
                <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-wider mb-2">Tasas por etapa</p>
                {[
                  { label: "Contacto (llam. contest.)", val: pct(selected.llamadas_contestadas, selected.llamadas),    den: selected.llamadas },
                  { label: "Brochures / contactados",   val: pct(selected.brochures ?? 0, selected.llamadas_contestadas), den: selected.llamadas_contestadas },
                  { label: "Reunión / contactados",     val: pct(selected.reuniones, selected.llamadas_contestadas),    den: selected.llamadas_contestadas },
                  { label: "Propuesta / reunión",       val: pct(selected.propuestas, selected.reuniones),             den: selected.reuniones },
                  { label: "Cierre / propuesta",        val: pct(selected.propuestas_ganadas, selected.propuestas),    den: selected.propuestas },
                ].map(t => (
                  <div key={t.label} className="mb-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-zinc-500">{t.label}</span>
                      <span className="text-[9px] font-bold text-zinc-300">{t.den > 0 ? `${t.val}%` : "—"}</span>
                    </div>
                    {t.den > 0 && (
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${t.val}%`, backgroundColor: t.val >= 50 ? COLORS.dark : t.val >= 25 ? COLORS.mutedDark : COLORS.muted }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Valor pipeline */}
              <div className="flex justify-between items-center border-t border-white/8 pt-2">
                <span className="text-[10px] text-zinc-500">Valor pipeline</span>
                <span className="text-[12px] font-bold text-brand">{fmtVal(selected.valor)}</span>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl flex items-center justify-center h-[200px]">
              <p className="text-[10px] text-zinc-400 text-center px-4 leading-relaxed">
                Clic en un<br />departamento<br />para el análisis completo
              </p>
            </div>
          )}

          {/* Leyenda */}
          <div className="border border-white/8 rounded-xl p-3">
            <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-wider mb-2.5">
              {modo === "volumen" ? "Cantidad de leads" : "Tasa de cierre"}
            </p>
            {(modo === "volumen" ? LEYENDA_VOLUMEN : LEYENDA_CONV).map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-3 rounded shrink-0 border border-white/10" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-zinc-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Top regiones */}
          <div className="border border-white/8 rounded-xl p-3">
            <p className="text-[9px] font-bold text-zinc-100 uppercase tracking-wider mb-2">Top regiones</p>
            <div className="space-y-0.5">
              {data.slice(0, 7).map((d, i) => (
                <div key={d.zona}
                  className={`flex items-center gap-2 px-1.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    selected?.zona === d.zona ? "bg-zinc-800" : "hover:bg-zinc-800/40"
                  }`}
                  onClick={() => handleSelectRegion(normalize(d.zona))}
                >
                  <span className="text-[9px] text-zinc-400 w-3 shrink-0">{i + 1}</span>
                  <span className="text-[10px] text-zinc-300 flex-1 truncate capitalize">{d.zona.replace(/_/g," ")}</span>
                  <span className="text-[10px] font-bold text-zinc-200 shrink-0">{d.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Análisis profundo al seleccionar ── */}
      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <EmbудоConversion d={selected} todos={data} />
          <div>
            <RadarEficiencia d={selected} todos={data} />
            <InsightRegion d={selected} />
          </div>
        </div>
      )}

    </div>
  );
}
