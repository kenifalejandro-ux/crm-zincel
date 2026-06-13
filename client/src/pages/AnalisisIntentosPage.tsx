/** client/src/pages/AnalisisIntentosPage.tsx */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CARD_CLASS, HEADER_CLASS, BADGE_BASE, INPUT_BASE } from "../lib/tokens";
import { useChartColors } from "../hooks/useChartColors";
import { Phone, Users, RefreshCw, ArrowLeft, Lightbulb, PhoneCall, PhoneMissed, Building2 } from "lucide-react";
import api from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Resumen {
  total_llamadas:    number;
  empresas_unicas:   number;
  promedio_intentos: number;
  empresas_1:        number;
  empresas_2:        number;
  empresas_3mas:     number;
  llamadas_en_3mas:  number;
}

interface EmpresaIntento {
  id:              string;
  empresa:         string;
  nombre_contacto: string | null;
  total_llamadas:  number;
  ultima_llamada:  string | null;
  estado_lead:     string;
  canal_principal: string;
  contestadas:     number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, string> = {
  interesado:          "Interesado",
  solicita_informacion:"Solicita info",
  volver_a_llamar:     "Volver a llamar",
  ocupado_en_reunion:  "Ocupado / En reunión",
  prometio_llamar:     "Prometió llamar",
  no_interesado:       "No interesado",
  no_contesta:         "No contesta",
  buzon_de_voz:        "Buzón de voz",
  fuera_de_servicio:   "Fuera servicio",
  numero_equivocado:   "Nro. equivocado",
  ya_tiene_proveedor:  "Tiene proveedor",
  por_gestionar:       "Por gestionar",
  perdida:             "Pérdida",
};

const ESTADO_COLOR: Record<string, string> = {
  interesado:          "bg-green-100 text-green-800",
  solicita_informacion:"bg-blue-100 text-blue-800",
  volver_a_llamar:     "bg-yellow-100 text-yellow-800",
  ocupado_en_reunion:  "bg-yellow-100 text-yellow-800",
  prometio_llamar:     "bg-purple-100 text-purple-700",
  no_interesado:       "bg-red-100 text-red-800",
  no_contesta:         "bg-zinc-100 text-zinc-600",
  buzon_de_voz:        "bg-zinc-100 text-zinc-500",
  fuera_de_servicio:   "bg-zinc-200 text-zinc-500",
  numero_equivocado:   "bg-orange-100 text-orange-700",
  ya_tiene_proveedor:  "bg-purple-100 text-purple-700",
  por_gestionar:       "bg-zinc-100 text-zinc-500",
  perdida:             "bg-red-100 text-red-700",
};

function fmtFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function generarLectura(d: Resumen) {
  const pct1   = Math.round((d.empresas_1    / d.empresas_unicas) * 100);
  const pct3   = Math.round((d.empresas_3mas / d.empresas_unicas) * 100);
  const pctEsf = d.total_llamadas > 0 ? Math.round((d.llamadas_en_3mas / d.total_llamadas) * 100) : 0;
  const prom   = Number(d.promedio_intentos);

  const titulo = prom < 1.3 ? "Alta eficiencia de contacto"
    : prom < 2.0 ? "Eficiencia moderada"
    : "Alto retrabajo comercial";

  const parrafos = [
    `De ${d.empresas_unicas} empresas prospectadas, el ${pct1}% se contactó al primer intento` +
    (pct1 >= 70 ? " — buena calidad de datos de contacto."
    : pct1 >= 50 ? " — hay margen para mejorar la calidad de datos."
    : " — la mayoría requiere múltiples intentos, revisa los datos de contacto."),

    d.empresas_2 > 0
      ? `${d.empresas_2} empresas requirieron 2 llamadas — normal en prospección activa.`
      : "",

    d.empresas_3mas > 0
      ? `${d.empresas_3mas} empresas (${pct3}%) concentran 3 o más intentos: ${d.llamadas_en_3mas} llamadas en total, el ${pctEsf}% de todo tu esfuerzo.`
      : "",
  ].filter(Boolean);

  const alerta = d.empresas_3mas > 0 && pctEsf >= 15
    ? `${d.empresas_3mas} empresas con 3+ intentos absorben el ${pctEsf}% de tus llamadas. Revísalas: si llevan más de 3 semanas sin respuesta, descártalas para liberar ese esfuerzo.`
    : prom >= 2.0
    ? "El promedio de intentos es alto. Considera depurar la base: elimina leads con datos de contacto inválidos."
    : null;

  return { titulo, parrafos, alerta };
}

// ── Componente principal ───────────────────────────────────────────────────────

type FiltroIntentos = "todos" | "1" | "2" | "3mas";

export default function AnalisisIntentosPage() {
  const c = useChartColors();
  const navigate = useNavigate();
  const [resumen,   setResumen]   = useState<Resumen | null>(null);
  const [empresas,  setEmpresas]  = useState<EmpresaIntento[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [filtro,    setFiltro]    = useState<FiltroIntentos>("todos");
  const [busqueda,  setBusqueda]  = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/llamadas/analisis-intentos"),
      api.get("/llamadas/empresas-intentos"),
    ]).then(([r, e]) => {
      setResumen(r.data.data);
      setEmpresas(e.data.data);
    }).catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const empresasFiltradas = useMemo(() => {
    let lista = empresas;
    if (filtro === "1")    lista = lista.filter(e => e.total_llamadas === 1);
    if (filtro === "2")    lista = lista.filter(e => e.total_llamadas === 2);
    if (filtro === "3mas") lista = lista.filter(e => e.total_llamadas >= 3);
    if (busqueda.trim())   lista = lista.filter(e =>
      e.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.nombre_contacto ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );
    return lista;
  }, [empresas, filtro, busqueda]);

  if (cargando) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
    </div>
  );
  if (!resumen) return null;

  const prom  = Number(resumen.promedio_intentos);
  const pct1  = Math.round((resumen.empresas_1    / resumen.empresas_unicas) * 100);
  const pct2  = Math.round((resumen.empresas_2    / resumen.empresas_unicas) * 100);
  const pct3  = Math.round((resumen.empresas_3mas / resumen.empresas_unicas) * 100);
  const { titulo, parrafos, alerta } = generarLectura(resumen);

  const FILTROS: { id: FiltroIntentos; label: string; count: number }[] = [
    { id: "todos", label: "Todas",       count: resumen.empresas_unicas },
    { id: "1",     label: "1 llamada",   count: resumen.empresas_1      },
    { id: "2",     label: "2 llamadas",  count: resumen.empresas_2      },
    { id: "3mas",  label: "3 o más",     count: resumen.empresas_3mas   },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/llamadas")} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={16} className="text-zinc-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Intentos vs Cobertura</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Análisis de eficiencia comercial en llamadas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Phone size={15} />,     label: "Llamadas totales",    value: resumen.total_llamadas,  sub: "registros en BD",                          color: "text-zinc-700" },
          { icon: <Users size={15} />,     label: "Empresas únicas",     value: resumen.empresas_unicas, sub: "prospectadas al menos 1 vez",              color: "text-zinc-700" },
          { icon: <RefreshCw size={15} />, label: "Intentos / empresa",  value: `${prom.toFixed(2)}x`,   sub: prom < 1.5 ? "eficiencia alta" : prom < 2 ? "eficiencia moderada" : "retrabajo alto", color: prom < 1.5 ? "text-green-600" : prom < 2 ? "text-yellow-600" : "text-red-500" },
          { icon: <Building2 size={15} />, label: "Al 1er intento",      value: `${pct1}%`,              sub: `${resumen.empresas_1} de ${resumen.empresas_unicas} empresas`, color: pct1 >= 70 ? "text-green-600" : "text-yellow-600" },
        ].map((k, i) => (
          <div key={i} className={`${CARD_CLASS} flex items-start gap-3`}>
            <span className="mt-0.5 text-zinc-400">{k.icon}</span>
            <div>
              <p className="text-[10px] text-zinc-100 uppercase tracking-widest">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Distribución + Lectura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribución */}
        <div className={CARD_CLASS}>
          <h2 className={HEADER_CLASS}>
            <span className="mr-2 text-violet-500 text-sm">◼</span>
            Distribución de intentos
          </h2>
          <div className="space-y-4 mt-3">
            {[
              { label: "1 llamada",  count: resumen.empresas_1,    pct: pct1, color: c.success, desc: "contactaron al primer intento" },
              { label: "2 llamadas", count: resumen.empresas_2,    pct: pct2, color: c.accent, desc: "necesitaron un segundo intento" },
              { label: "3 o más",   count: resumen.empresas_3mas,  pct: pct3, color: c.danger,  desc: `${resumen.llamadas_en_3mas} llamadas concentradas` },
            ].map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-zinc-300">{row.label}</span>
                  <span className="text-zinc-500">{row.count} empresas · <span className="font-bold text-zinc-200">{row.pct}%</span></span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                </div>
                <p className="text-[10px] text-zinc-400">{row.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 border-t border-white/8 pt-3 mt-4">
            {resumen.total_llamadas} llamadas → {resumen.empresas_unicas} empresas · promedio {prom.toFixed(2)} intentos/empresa
          </p>
        </div>

        {/* Lectura */}
        <div className={CARD_CLASS}>
          <h2 className={HEADER_CLASS}>
            <Lightbulb size={14} className="mr-2 text-amber-500" strokeWidth={2} />
            Lectura del análisis
          </h2>
          <div className="mt-3 space-y-3">
            <p className="text-sm font-semibold text-zinc-200">{titulo}</p>
            {parrafos.map((p, i) => (
              <p key={i} className="text-xs text-zinc-400 leading-relaxed">{p}</p>
            ))}
          </div>
          {alerta && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <span className="font-bold">Recomendación: </span>{alerta}
              </p>
            </div>
          )}
          {!alerta && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-[11px] text-green-800 leading-relaxed">
                <span className="font-bold">Estado saludable: </span>Tu base de datos muestra buena calidad de contacto. Continúa con el ritmo actual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de empresas */}
      <div className={CARD_CLASS}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className={HEADER_CLASS}>
            <Building2 size={14} className="mr-2 text-blue-500" strokeWidth={2} />
            Detalle por empresa
          </h2>
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={`${INPUT_BASE} text-xs px-3 py-1.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-brand`}
          />
        </div>

        {/* Filtros de intentos */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filtro === f.id
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-slate-800/60 text-zinc-400 border-white/10 hover:border-zinc-400"
              }`}
            >
              {f.label} <span className="opacity-60 ml-1">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8">
                {["Empresa", "Contacto", "Llamadas", "Contestadas", "Última llamada", "Canal", "Estado"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-zinc-100 uppercase tracking-wider pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {empresasFiltradas.map(e => {
                const noContesta = e.contestadas === 0;
                return (
                  <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-zinc-200 max-w-[180px] truncate">{e.empresa}</td>
                    <td className="py-2.5 pr-4 text-zinc-500 max-w-[140px] truncate">{e.nombre_contacto || "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${e.total_llamadas >= 3 ? "text-red-500" : e.total_llamadas === 2 ? "text-yellow-600" : "text-zinc-300"}`}>
                        {e.total_llamadas}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-1">
                        {noContesta
                          ? <PhoneMissed size={11} className="text-red-400" />
                          : <PhoneCall   size={11} className="text-green-500" />
                        }
                        <span className={noContesta ? "text-red-400" : "text-green-600"}>{e.contestadas}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500">{fmtFecha(e.ultima_llamada)}</td>
                    <td className="py-2.5 pr-4 text-zinc-500 capitalize">{e.canal_principal}</td>
                    <td className="py-2.5">
                      <span className={`${BADGE_BASE} text-[10px] px-2 py-0.5 font-medium ${ESTADO_COLOR[e.estado_lead] ?? "bg-zinc-800 text-zinc-500"}`}>
                        {ESTADO_LABEL[e.estado_lead] ?? e.estado_lead}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-400 mt-3">{empresasFiltradas.length} empresas · rojo = 3+ intentos sin contacto · amarillo = 2 intentos</p>
      </div>

    </div>
  );
}
