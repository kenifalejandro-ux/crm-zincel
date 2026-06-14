/** src/components/metricas/ImportarCSVMetrica.tsx */

import { MODAL_BASE, INPUT_BASE } from "../../lib/tokens";
import { useRef, useState }                  from "react";
import { Upload, X, Check, AlertCircle }     from "lucide-react";
import { createMetrica }                     from "../../services/metricas.api";
import { Plataforma }                        from "../../types/metricas.types";

interface Props {
  onImportado: () => void;
  onCerrar:    () => void;
}

// ─── Mapeo de columnas CSV → campos del modelo ─────────────────────────────────
const MAPA_COLUMNAS: Record<string, string> = {

  // ── Nombre campaña ──────────────────────────────────────────────────────────
  "nombre del conjunto de anuncios": "campana_nombre",
  "nombre de la campaña":            "campana_nombre",
  "campaign name":                   "campana_nombre",
  "ad set name":                     "campana_nombre",
  "ad group name":                   "campana_nombre",
  "campaign":                        "campana_nombre",

  // ── Gasto ───────────────────────────────────────────────────────────────────
  "importe gastado (usd)":           "gasto",
  "importe gastado":                 "gasto",
  "amount spent (usd)":              "gasto",
  "amount spent":                    "gasto",
  "cost":                            "gasto",
  "spend":                           "gasto",

  // ── Ingresos ────────────────────────────────────────────────────────────────
  "ingresos":                        "ingresos",
  "revenue":                         "ingresos",
  "purchase value":                  "ingresos",
  "conversion value":                "ingresos",
  "valor de conversión":             "ingresos",

  // ── Costo total ─────────────────────────────────────────────────────────────
  "costo total":                     "costo_total",
  "total cost":                      "costo_total",
  "coste total":                     "costo_total",

  // ── Impresiones ─────────────────────────────────────────────────────────────
  "impresiones":                     "impresiones",
  "impressions":                     "impresiones",

  // ── Alcance ─────────────────────────────────────────────────────────────────
  "alcance":                         "alcance",
  "reach":                           "alcance",

  // ── Clics ───────────────────────────────────────────────────────────────────
  "clics en el enlace":              "clics",
  "clics (todos)":                   "clics",
  "link clicks":                     "clics",
  "clicks":                          "clics",

  // ── CTR ─────────────────────────────────────────────────────────────────────
  "ctr (todos)":                     "ctr",
  "ctr (tasa de clics en el enlace)":"ctr",
  "ctr (all)":                       "ctr",
  "ctr":                             "ctr",

  // ── CPC ─────────────────────────────────────────────────────────────────────
  "cpc (todos)":                     "cpc",
  "cpc (cost per link click)":       "cpc",
  "cpc (all)":                       "cpc",
  "cpc":                             "cpc",
  "avg. cpc":                        "cpc",

  // ── CPM ─────────────────────────────────────────────────────────────────────
  "cpm (coste por 1.000 impresiones)": "cpm",
  "cpm (cost per 1,000 impressions)":  "cpm",
  "cpm":                               "cpm",

  // ── CPA ─────────────────────────────────────────────────────────────────────
  "cpa":                             "cpa",
  "cost per result":                 "cpa",
  "coste por resultado":             "cpa",

  // ── Conversiones ────────────────────────────────────────────────────────────
  "resultados":                      "conversiones",
  "results":                         "conversiones",
  "conversions":                     "conversiones",
  "conversiones":                    "conversiones",

  // ── Leads ───────────────────────────────────────────────────────────────────
  "clientes potenciales":            "leads",
  "leads":                           "leads",

  // ── Mensajes ────────────────────────────────────────────────────────────────
  "mensajes":                        "mensajes",
  "messages":                        "mensajes",
  "messaging conversations started": "mensajes",
  "conversaciones iniciadas":        "mensajes",

  // ── ROAS ────────────────────────────────────────────────────────────────────
  "roas (retorno del gasto en publicidad)": "roas",
  "purchase roas":                          "roas",
  "roas":                                   "roas",

  // ── ROI ─────────────────────────────────────────────────────────────────────
  "roi":                             "roi",
  "return on investment":            "roi",

  // ── Frecuencia ──────────────────────────────────────────────────────────────
  "frecuencia":                      "frecuencia",
  "frequency":                       "frecuencia",

  // ── Seguidores ganados ──────────────────────────────────────────────────────
  "nuevos seguidores":               "seguidores_ganados",
  "page likes":                      "seguidores_ganados",
  "follower gains":                  "seguidores_ganados",
  "seguidores ganados":              "seguidores_ganados",

  // ── Visitas al perfil ───────────────────────────────────────────────────────
  "visitas al perfil":               "perfil_visitas",
  "profile visits":                  "perfil_visitas",
  "page views":                      "perfil_visitas",

  // ── Engagement ──────────────────────────────────────────────────────────────
  "me gusta":                        "me_gusta",
  "reacciones":                      "me_gusta",
  "likes":                           "me_gusta",
  "comentarios":                     "comentarios",
  "comments":                        "comentarios",
  "compartidos":                     "compartidos",
  "shares":                          "compartidos",
  "guardados":                       "guardados",
  "saved":                           "guardados",
  "saves":                           "guardados",
  "tasa de interacción":             "tasa_engagement",
  "engagement rate":                 "tasa_engagement",
  "tasa_engagement":                 "tasa_engagement",

  // ── Costo por mensaje ───────────────────────────────────────────────────────
  "costo por mensaje":               "costo_por_mensaje",
  "cost per message":                "costo_por_mensaje",
  "cost per messaging conversation": "costo_por_mensaje",

  // ── Video ───────────────────────────────────────────────────────────────────
  "reproducciones de video":         "reproducciones",
  "video views":                     "reproducciones",
  "views":                           "reproducciones",
  "reproducciones":                  "reproducciones",
  "porcentaje de video visto":       "tasa_reproduccion",
  "video completion rate":           "tasa_reproduccion",
  "tasa de reproducción":            "tasa_reproduccion",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const limpiarNumero = (v: string) => v.replace(/[^0-9.]/g, "") || "0";

const parsearCSV = (texto: string): Record<string, string>[] => {
  const lineas  = texto.trim().split("\n");
  const headers = lineas[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, "").toLowerCase());

  return lineas.slice(1)
    .filter((l) => l.trim())
    .map((linea) => {
      const valores = linea.split(",").map((v) => v.trim().replace(/"/g, ""));
      const fila: Record<string, string> = {};
      headers.forEach((h, i) => { fila[h] = valores[i] ?? ""; });
      return fila;
    });
};

const mapearFila = (fila: Record<string, string>): Record<string, string> => {
  const resultado: Record<string, string> = {};
  Object.entries(fila).forEach(([col, val]) => {
    const campo = MAPA_COLUMNAS[col.toLowerCase().trim()];
    if (campo) resultado[campo] = limpiarNumero(val);
  });
  return resultado;
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Estado = "idle" | "preview" | "cargando" | "ok" | "error";

// ─── Componente ───────────────────────────────────────────────────────────────
export const ImportarCSVMetrica = ({ onImportado, onCerrar }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [empresa,    setEmpresa]    = useState("");
  const [plataforma, setPlataforma] = useState<Plataforma>("meta");
  const [subPlat,    setSubPlat]    = useState("");
  const [periodoI,   setPeriodoI]   = useState("");
  const [periodoF,   setPeriodoF]   = useState("");
  const [filas,      setFilas]      = useState<Record<string, string>[]>([]);
  const [estado,     setEstado]     = useState<Estado>("idle");
  const [mensaje,    setMensaje]    = useState("");

  // ── Leer archivo ──────────────────────────────────────────────────────────
  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto   = ev.target?.result as string;
      const parsed  = parsearCSV(texto);
      const mapeado = parsed
        .map(mapearFila)
        .filter((f) => Object.keys(f).length > 0);
      setFilas(mapeado);
      setEstado("preview");
      setMensaje(
        mapeado.length > 0
          ? `${mapeado.length} fila(s) detectadas y listas para importar`
          : "No se detectaron columnas reconocidas en el archivo"
      );
    };
    reader.readAsText(file, "UTF-8");
  };

  // ── Importar ──────────────────────────────────────────────────────────────
  const handleImportar = async () => {
    if (!empresa || !periodoI || !periodoF || !filas.length) return;
    setEstado("cargando");
    try {
      await Promise.all(
        filas.map((fila) =>
          createMetrica({
            empresa,
            plataforma,
            sub_plataforma:     plataforma === "meta" ? subPlat : "",
            periodo_inicio:     periodoI,
            periodo_fin:        periodoF,
            campana_nombre:     fila.campana_nombre     || "Sin nombre",
            objetivo:           "venta",
            proyectos:          [],

            // Alcance
            impresiones:        fila.impresiones        || "0",
            alcance:            fila.alcance            || "0",
            clics:              fila.clics              || "0",
            ctr:                fila.ctr                || "0",

            // Costo
            gasto:              fila.gasto              || "0",
            cpc:                fila.cpc                || "0",
            cpm:                fila.cpm                || "0",
            cpa:                fila.cpa                || "0",

            // Ingresos ← nuevos
            ingresos:           fila.ingresos           || "0",
            costo_total:        fila.costo_total        || "0",

            // Resultados
            conversiones:       fila.conversiones       || "0",
            leads:              fila.leads              || "0",
            mensajes:           fila.mensajes           || "0",  // ← nuevo
            roas:               fila.roas               || "0",
            roi:                fila.roi                || "0",
            costo_por_lead:     fila.costo_por_lead     || "0",

            // Comunidad
            seguidores_ganados: fila.seguidores_ganados || "0",
            perfil_visitas:     fila.perfil_visitas     || "0",
            frecuencia:         fila.frecuencia         || "0",  // ← nuevo

            // Engagement
            interacciones:      fila.interacciones      || "0",
            me_gusta:           fila.me_gusta           || "0",
            comentarios:        fila.comentarios        || "0",
            compartidos:        fila.compartidos        || "0",
            guardados:          fila.guardados          || "0",
            tasa_engagement:    fila.tasa_engagement    || "0",
            costo_por_mensaje:  fila.costo_por_mensaje  || "0",  // ← nuevo

            // Video
            reproducciones:     fila.reproducciones     || "0",
            tasa_reproduccion:  fila.tasa_reproduccion  || "0",

            notas: "",
          })
        )
      );
      setEstado("ok");
      setMensaje(`✓ ${filas.length} métricas importadas correctamente`);
      setTimeout(() => { onImportado(); onCerrar(); }, 1500);
    } catch {
      setEstado("error");
      setMensaje("Error al importar. Revisa el archivo e intenta de nuevo.");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`${MODAL_BASE} w-full max-w-lg`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Importar CSV</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compatible con Meta Ads, Google Ads y TikTok Ads
            </p>
          </div>
          <button onClick={onCerrar} className="text-zinc-400 hover:text-zinc-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">

          {/* Empresa + Plataforma */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Empresa *</label>
              <input
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
                placeholder="Nombre de empresa"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Plataforma *</label>
              <select
                value={plataforma}
                onChange={(e) => {
                  setPlataforma(e.target.value as Plataforma);
                  setSubPlat("");
                }}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
              >
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok Ads</option>
              </select>
            </div>
          </div>

          {/* Sub plataforma solo si Meta */}
          {plataforma === "meta" && (
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Red social</label>
              <select
                value={subPlat}
                onChange={(e) => setSubPlat(e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
              >
                <option value="">Ambas (Facebook + Instagram)</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="audience_network">Audience Network</option>
              </select>
            </div>
          )}

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Período inicio *</label>
              <input
                type="date" value={periodoI}
                onChange={(e) => setPeriodoI(e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Período fin *</label>
              <input
                type="date" value={periodoF}
                onChange={(e) => setPeriodoF(e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <Upload size={20} className="mx-auto text-zinc-400 mb-2" />
            <p className="text-xs text-zinc-300 font-medium">
              Haz clic para seleccionar tu archivo CSV
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Exporta el reporte directamente desde Meta Ads, Google Ads o TikTok Ads
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleArchivo}
            />
          </div>

          {/* Estado */}
          {estado !== "idle" && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              estado === "ok"      ? "bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300" :
              estado === "error"   ? "bg-red-50   text-red-700"   :
              estado === "preview" ? "bg-blue-50  text-blue-700"  :
                                     "bg-zinc-800/40  text-zinc-300"
            }`}>
              {estado === "ok"    && <Check       size={13} />}
              {estado === "error" && <AlertCircle size={13} />}
              {mensaje}
            </div>
          )}

          {/* Preview campos detectados */}
          {estado === "preview" && filas.length > 0 && (
            <div className="bg-zinc-800/40 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-2">
                Campos detectados en el CSV
              </p>
              {Object.keys(filas[0]).map((campo) => (
                <div key={campo} className="flex items-center gap-2">
                  <Check size={10} className="text-green-500 shrink-0" />
                  <span className="text-[11px] text-zinc-400">{campo}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/[0.08]">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleImportar}
            disabled={estado !== "preview" || !empresa || !periodoI || !periodoF || filas.length === 0}
            className="px-4 py-2 text-xs btn-primary rounded-lg transition disabled:opacity-40"
          >
            {estado === "cargando"
              ? "Importando..."
              : `Importar ${filas.length} fila(s)`
            }
          </button>
        </div>

      </div>
    </div>
  );
};