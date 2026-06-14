/** client/src/pages/AnalisisIntentosPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación. Lógica INTACTA: endpoints /llamadas/analisis-intentos
 * y /llamadas/empresas-intentos, useChartColors(), generarLectura(), filtros, búsqueda.
 *
 * Qué se rediseñó:
 *  - KPIs: cajas planas (text-zinc-700/green-600) → cards neon con ícono+glow y color semántico.
 *  - Distribución: se añade gauge radial del promedio de intentos; barras con glow (antes bg-zinc-800).
 *  - Lectura: recomendación bg-amber-50 / bg-green-50 (tema claro) → paneles neon ámbar/esmeralda.
 *  - Badges de estado: ESTADO_COLOR migrado de bg-green-100/text-green-800 → chips neon (ESTADO_NEON).
 *  - Filtros: bg-zinc-900 → bg-accent-15/text-accent. Bordes válidos (antes border-white/8).
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useChartColors } from "../hooks/useChartColors";
import { Phone, Users, RefreshCw, ArrowLeft, Lightbulb, PhoneCall, PhoneMissed, Building2, Search } from "lucide-react";
import api from "../services/api";

interface Resumen {
  total_llamadas: number; empresas_unicas: number; promedio_intentos: number;
  empresas_1: number; empresas_2: number; empresas_3mas: number; llamadas_en_3mas: number;
}
interface EmpresaIntento {
  id: string; empresa: string; nombre_contacto: string | null; total_llamadas: number;
  ultima_llamada: string | null; estado_lead: string; canal_principal: string; contestadas: number;
}

const ESTADO_LABEL: Record<string, string> = {
  interesado: "Interesado", solicita_informacion: "Solicita info", volver_a_llamar: "Volver a llamar",
  ocupado_en_reunion: "Ocupado / En reunión", prometio_llamar: "Prometió llamar", no_interesado: "No interesado",
  no_contesta: "No contesta", buzon_de_voz: "Buzón de voz", fuera_de_servicio: "Fuera servicio",
  numero_equivocado: "Nro. equivocado", ya_tiene_proveedor: "Tiene proveedor", por_gestionar: "Por gestionar", perdida: "Pérdida",
};

/** Color HEX por estado (chip neon: texto + fondo translúcido + borde). */
const ESTADO_HEX: Record<string, string> = {
  interesado: "#22d3ee", solicita_informacion: "#3b82f6", volver_a_llamar: "#fbbf24",
  ocupado_en_reunion: "#fbbf24", prometio_llamar: "#a855f7", no_interesado: "#f87171",
  no_contesta: "#94a3b8", buzon_de_voz: "#fb923c", fuera_de_servicio: "#94a3b8",
  numero_equivocado: "#fb923c", ya_tiene_proveedor: "#a855f7", por_gestionar: "#94a3b8", perdida: "#f87171",
};

function fmtFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function generarLectura(d: Resumen) {
  const pct1 = Math.round((d.empresas_1 / d.empresas_unicas) * 100);
  const pct3 = Math.round((d.empresas_3mas / d.empresas_unicas) * 100);
  const pctEsf = d.total_llamadas > 0 ? Math.round((d.llamadas_en_3mas / d.total_llamadas) * 100) : 0;
  const prom = Number(d.promedio_intentos);
  const titulo = prom < 1.3 ? "Alta eficiencia de contacto" : prom < 2.0 ? "Eficiencia moderada" : "Alto retrabajo comercial";
  const parrafos = [
    `De ${d.empresas_unicas} empresas prospectadas, el ${pct1}% se contactó al primer intento` +
    (pct1 >= 70 ? " — buena calidad de datos de contacto." : pct1 >= 50 ? " — hay margen para mejorar la calidad de datos." : " — la mayoría requiere múltiples intentos, revisa los datos de contacto."),
    d.empresas_2 > 0 ? `${d.empresas_2} empresas requirieron 2 llamadas — normal en prospección activa.` : "",
    d.empresas_3mas > 0 ? `${d.empresas_3mas} empresas (${pct3}%) concentran 3 o más intentos: ${d.llamadas_en_3mas} llamadas en total, el ${pctEsf}% de todo tu esfuerzo.` : "",
  ].filter(Boolean);
  const alerta = d.empresas_3mas > 0 && pctEsf >= 15
    ? `${d.empresas_3mas} empresas con 3+ intentos absorben el ${pctEsf}% de tus llamadas. Revísalas: si llevan más de 3 semanas sin respuesta, descártalas para liberar ese esfuerzo.`
    : prom >= 2.0 ? "El promedio de intentos es alto. Considera depurar la base: elimina leads con datos de contacto inválidos." : null;
  return { titulo, parrafos, alerta };
}

type FiltroIntentos = "todos" | "1" | "2" | "3mas";

export default function AnalisisIntentosPage() {
  const c = useChartColors();
  const navigate = useNavigate();
  const [resumen, setResumen]   = useState<Resumen | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaIntento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro]     = useState<FiltroIntentos>("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/llamadas/analisis-intentos"),
      api.get("/llamadas/empresas-intentos"),
    ]).then(([r, e]) => { setResumen(r.data.data); setEmpresas(e.data.data); })
      .catch(console.error).finally(() => setCargando(false));
  }, []);

  const empresasFiltradas = useMemo(() => {
    let lista = empresas;
    if (filtro === "1") lista = lista.filter(e => e.total_llamadas === 1);
    if (filtro === "2") lista = lista.filter(e => e.total_llamadas === 2);
    if (filtro === "3mas") lista = lista.filter(e => e.total_llamadas >= 3);
    if (busqueda.trim()) lista = lista.filter(e =>
      e.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.nombre_contacto ?? "").toLowerCase().includes(busqueda.toLowerCase()));
    return lista;
  }, [empresas, filtro, busqueda]);

  if (cargando) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/10" style={{ borderBottomColor: "rgb(var(--accent))" }} />
    </div>
  );
  if (!resumen) return null;

  const prom = Number(resumen.promedio_intentos);
  const pct1 = Math.round((resumen.empresas_1 / resumen.empresas_unicas) * 100);
  const pct2 = Math.round((resumen.empresas_2 / resumen.empresas_unicas) * 100);
  const pct3 = Math.round((resumen.empresas_3mas / resumen.empresas_unicas) * 100);
  const pctEsf = resumen.total_llamadas > 0 ? Math.round((resumen.llamadas_en_3mas / resumen.total_llamadas) * 100) : 0;
  const { titulo, parrafos, alerta } = generarLectura(resumen);

  // Gauge de eficiencia: 1.0x → 100%, 2.5x → 0%
  const efic = Math.max(0, Math.min(100, Math.round((2.5 - prom) / 1.5 * 100)));
  const eficColor = prom < 1.5 ? "#34d399" : prom < 2 ? "#fbbf24" : "#f87171";

  const TONE = { accent: "rgb(var(--accent))", good: "#34d399", warn: "#fbbf24", danger: "#f87171", neutral: "#f4f4f5" } as const;
  type ToneKey = keyof typeof TONE;
  const kpis: { Icon: any; label: string; value: any; sub: string; tone: ToneKey }[] = [
    { Icon: Phone,     label: "Llamadas totales",   value: resumen.total_llamadas,  sub: "registros en BD",            tone: "accent" },
    { Icon: Users,     label: "Empresas únicas",    value: resumen.empresas_unicas, sub: "prospectadas ≥ 1 vez",       tone: "neutral" },
    { Icon: RefreshCw, label: "Intentos / empresa", value: `${prom.toFixed(2)}x`,   sub: prom < 1.5 ? "eficiencia alta" : prom < 2 ? "eficiencia moderada" : "retrabajo alto", tone: (prom < 1.5 ? "good" : prom < 2 ? "warn" : "danger") as ToneKey },
    { Icon: Building2, label: "Al 1er intento",     value: `${pct1}%`,              sub: `${resumen.empresas_1} de ${resumen.empresas_unicas}`, tone: (pct1 >= 70 ? "good" : "warn") as ToneKey },
  ];

  const FILTROS: { id: FiltroIntentos; label: string; count: number }[] = [
    { id: "todos", label: "Todas",      count: resumen.empresas_unicas },
    { id: "1",     label: "1 llamada",  count: resumen.empresas_1 },
    { id: "2",     label: "2 llamadas", count: resumen.empresas_2 },
    { id: "3mas",  label: "3 o más",    count: resumen.empresas_3mas },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/llamadas")} className="btn-ghost p-2 text-zinc-400"><ArrowLeft size={16} /></button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Análisis de intentos</p>
          <h1 className="font-display text-[26px] font-bold text-zinc-50 tracking-tight leading-tight mt-0.5">Intentos vs Cobertura</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Análisis de eficiencia comercial en llamadas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const col = TONE[k.tone];
          const isAccent = k.tone === "accent";
          return (
            <div key={k.label} className="neon-card neon-hover p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: isAccent ? "rgb(var(--accent) / 0.12)" : `${col}1a`, border: `1px solid ${isAccent ? "rgb(var(--accent) / 0.3)" : col + "40"}`, color: col, boxShadow: `0 0 14px ${isAccent ? "rgb(var(--accent) / calc(0.25*var(--glow)))" : col + "30"}` }}>
                <k.Icon size={17} />
              </div>
              <p className="font-display text-[28px] font-bold leading-none tabular-nums mt-4"
                 style={{ color: k.tone === "neutral" ? "#f4f4f5" : col, textShadow: `0 0 16px ${isAccent ? "rgb(var(--accent) / calc(0.4*var(--glow)))" : k.tone === "neutral" ? "transparent" : col + "55"}` }}>{k.value}</p>
              <p className="text-[11.5px] font-semibold text-zinc-300 mt-2">{k.label}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Distribución + Lectura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución con gauge */}
        <div className="neon-card p-5">
          <div className="flex items-center gap-2 mb-4"><span className="text-violet-400">◼</span><p className="text-xs font-bold uppercase tracking-wider text-zinc-300">Distribución de intentos</p></div>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" fill="none" stroke={eficColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(efic / 100) * 251} 251`} transform="rotate(-90 48 48)" style={{ filter: `drop-shadow(0 0 4px ${eficColor})` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[20px] font-bold tabular-nums" style={{ color: eficColor }}>{prom.toFixed(2)}x</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">intentos</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold" style={{ color: eficColor }}>{titulo}</p>
              <p className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">{resumen.total_llamadas} llamadas → {resumen.empresas_unicas} empresas. {pctEsf}% del esfuerzo se concentra en {resumen.empresas_3mas} empresas.</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "1 llamada",  count: resumen.empresas_1,    pct: pct1, color: c.success, desc: "contactaron al primer intento" },
              { label: "2 llamadas", count: resumen.empresas_2,    pct: pct2, color: c.accent,  desc: "necesitaron un segundo intento" },
              { label: "3 o más",    count: resumen.empresas_3mas, pct: pct3, color: c.danger,  desc: `${resumen.llamadas_en_3mas} llamadas concentradas` },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-zinc-300">{row.label}</span>
                  <span className="text-zinc-500">{row.count} empresas · <span className="font-bold text-zinc-200">{row.pct}%</span></span>
                </div>
                <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color, boxShadow: `0 0 8px ${row.color}` }} />
                </div>
                <p className="text-[10px] text-zinc-500">{row.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 border-t border-white/[0.07] pt-3 mt-4">
            {resumen.total_llamadas} llamadas → {resumen.empresas_unicas} empresas · promedio {prom.toFixed(2)} intentos/empresa
          </p>
        </div>

        {/* Lectura */}
        <div className="neon-card p-5">
          <div className="flex items-center gap-2 mb-4"><Lightbulb size={14} className="text-amber-400" /><p className="text-xs font-bold uppercase tracking-wider text-zinc-300">Lectura del análisis</p></div>
          <p className="text-sm font-bold text-zinc-100">{titulo}</p>
          <div className="mt-3 space-y-2.5">
            {parrafos.map((p, i) => <p key={i} className="text-[12.5px] text-zinc-400 leading-relaxed">{p}</p>)}
          </div>
          {alerta ? (
            <div className="mt-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <Lightbulb size={14} className="text-amber-300 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-amber-200/90 leading-relaxed"><span className="font-bold text-amber-200">Recomendación: </span>{alerta}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <Lightbulb size={14} className="text-emerald-300 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-emerald-200/90 leading-relaxed"><span className="font-bold text-emerald-200">Estado saludable: </span>Tu base muestra buena calidad de contacto. Continúa con el ritmo actual.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="neon-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><Building2 size={14} className="text-accent" strokeWidth={2} /><p className="text-xs font-bold uppercase tracking-wider text-zinc-300">Detalle por empresa</p></div>
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input type="text" placeholder="Buscar empresa…" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="neon-input w-full pl-8 pr-3 py-1.5 text-xs" />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTROS.map(f => {
            const act = filtro === f.id;
            return (
              <button key={f.id} onClick={() => setFiltro(f.id)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${act ? "bg-accent-15 text-accent border-accent-30" : "bg-white/[0.04] text-zinc-400 border-white/10 hover:text-zinc-200 hover:bg-white/[0.07]"}`}>
                {f.label} <span className="opacity-60 ml-1">{f.count}</span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {["Empresa", "Contacto", "Llamadas", "Contestadas", "Última llamada", "Canal", "Estado"].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider pb-2.5 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empresasFiltradas.map(e => {
                const noContesta = e.contestadas === 0;
                const hex = ESTADO_HEX[e.estado_lead] ?? "#94a3b8";
                return (
                  <tr key={e.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] transition group">
                    <td className="py-3 pr-4 font-semibold text-zinc-200 max-w-[180px] truncate group-hover:text-accent transition-colors">{e.empresa}</td>
                    <td className="py-3 pr-4 text-zinc-500 max-w-[140px] truncate">{e.nombre_contacto || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="font-display font-bold tabular-nums" style={{ color: e.total_llamadas >= 3 ? "#f87171" : e.total_llamadas === 2 ? "#fbbf24" : "#d4d4d8" }}>{e.total_llamadas}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5">
                        {noContesta ? <PhoneMissed size={11} className="text-red-400" /> : <PhoneCall size={11} className="text-emerald-400" />}
                        <span style={{ color: noContesta ? "#f87171" : "#34d399" }}>{e.contestadas}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 tabular-nums">{fmtFecha(e.ultima_llamada)}</td>
                    <td className="py-3 pr-4 text-zinc-500 capitalize">{e.canal_principal}</td>
                    <td className="py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: hex, background: `${hex}18`, border: `1px solid ${hex}38` }}>
                        {ESTADO_LABEL[e.estado_lead] ?? e.estado_lead}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {empresasFiltradas.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">{empresasFiltradas.length} empresas · <span className="text-red-400">rojo</span> = 3+ intentos sin contacto · <span className="text-amber-400">amarillo</span> = 2 intentos</p>
      </div>
    </div>
  );
}