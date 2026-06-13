/** client/src/components/metricas/ModalImportarAPI.tsx */

import { MODAL_BASE, INPUT_BASE } from "../../lib/tokens";
import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { getEmpresasConCuentas, getPlataformasDeEmpresa } from "../../services/plataformaCuentas.api";
import { previewMetaAds, syncMetaAds }       from "../../services/metaAds.api";
import { previewTikTokAds, syncTikTokAds }   from "../../services/tiktokAds.api";
import { fechaHoy } from "../../utils/date";

interface Props {
  onCerrar:       () => void;
  onSincronizado: () => void;
}

type Paso = "empresa" | "plataforma" | "preview" | "exito";
type PlataformaAPI = "meta" | "tiktok" | "google";

const hoy    = () => fechaHoy();
const hace30 = () => { const d = new Date(); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const PLAT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; description: string }> = {
  meta:   { label: "Meta Ads",    color: "text-blue-700",  bg: "bg-blue-600",  icon: "f", description: "Facebook e Instagram Ads" },
  tiktok: { label: "TikTok Ads",  color: "text-pink-700",  bg: "bg-pink-500",  icon: "T", description: "TikTok for Business" },
  google: { label: "Google Ads",  color: "text-red-700",   bg: "bg-red-500",   icon: "G", description: "Próximamente" },
};

export function ModalImportarAPI({ onCerrar, onSincronizado }: Props) {
  const [paso,       setPaso]       = useState<Paso>("empresa");
  const [empresas,   setEmpresas]   = useState<string[]>([]);
  const [empresa,    setEmpresa]    = useState("");
  const [plataformas, setPlataformas] = useState<string[]>([]);
  const [plataforma, setPlataforma] = useState<PlataformaAPI | null>(null);
  const [desde,      setDesde]      = useState(hace30());
  const [hasta,      setHasta]      = useState(hoy());
  const [cargando,   setCargando]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [preview,    setPreview]    = useState<{ total: number; campanas: any[] } | null>(null);
  const [resultado,  setResultado]  = useState<{ insertados: number; duplicados: number; campanas: string[] } | null>(null);

  useEffect(() => {
    getEmpresasConCuentas().then(setEmpresas).catch(() => setEmpresas([]));
  }, []);

  const seleccionarEmpresa = async (emp: string) => {
    setEmpresa(emp);
    setCargando(true);
    try {
      const plats = await getPlataformasDeEmpresa(emp);
      setPlataformas(plats);
      setPaso("plataforma");
    } catch {
      setPlataformas([]);
      setPaso("plataforma");
    } finally { setCargando(false); }
  };

  const handlePreview = async () => {
    if (!plataforma) return;
    setError(null); setCargando(true);
    try {
      let data;
      if (plataforma === "meta")   data = await previewMetaAds(empresa, desde, hasta);
      if (plataforma === "tiktok") data = await previewTikTokAds(empresa, desde, hasta);
      if (!data) return;
      setPreview(data);
      setPaso("preview");
    } catch (err: any) {
      setError(err.response?.data?.message || `Error conectando con ${PLAT_CONFIG[plataforma]?.label}`);
    } finally { setCargando(false); }
  };

  const handleSync = async () => {
    if (!plataforma) return;
    setError(null); setCargando(true);
    try {
      let data;
      if (plataforma === "meta")   data = await syncMetaAds(empresa, desde, hasta);
      if (plataforma === "tiktok") data = await syncTikTokAds(empresa, desde, hasta);
      if (!data) return;
      setResultado(data);
      setPaso("exito");
      onSincronizado();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al importar");
    } finally { setCargando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`${MODAL_BASE} w-full max-w-md`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            {(paso === "plataforma" || paso === "preview") && (
              <button onClick={() => { setPaso(paso === "preview" ? "plataforma" : "empresa"); setError(null); setPreview(null); }}
                className="p-1 text-zinc-400 hover:text-zinc-400 transition">
                <ChevronLeft size={16} />
              </button>
            )}
            <h2 className="text-sm font-semibold text-zinc-200">
              {paso === "empresa"   && "Importar desde API"}
              {paso === "plataforma" && `${empresa} · Elegir plataforma`}
              {paso === "preview"   && `${PLAT_CONFIG[plataforma!]?.label} · Vista previa`}
              {paso === "exito"     && "Importación completada"}
            </h2>
          </div>
          <button onClick={onCerrar} className="text-zinc-400 hover:text-zinc-400 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* PASO 1: Elegir empresa */}
          {paso === "empresa" && (
            <>
              <p className="text-xs text-zinc-300">
                Selecciona la empresa cuyos datos quieres importar. Solo aparecen las que tienen credenciales de API configuradas.
              </p>
              {cargando ? (
                <div className="flex justify-center py-6">
                  <RefreshCw size={20} className="animate-spin text-zinc-300" />
                </div>
              ) : empresas.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-300">No hay empresas configuradas</p>
                  <p className="text-xs text-zinc-400 mt-1">Ve a <strong>Configuración</strong> y agrega las credenciales de API</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {empresas.map(emp => (
                    <button key={emp} onClick={() => seleccionarEmpresa(emp)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 hover:border-blue-400 hover:bg-blue-50 transition text-left group">
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-blue-700">{emp}</span>
                      <ChevronLeft size={14} className="text-zinc-400 rotate-180 group-hover:text-brand" />
                    </button>
                  ))}
                </div>
              )}

              {/* Rango de fechas global */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/8">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Desde</label>
                  <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                    className={`${INPUT_BASE} w-full text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Hasta</label>
                  <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                    className={`${INPUT_BASE} w-full text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50`} />
                </div>
              </div>
            </>
          )}

          {/* PASO 2: Elegir plataforma */}
          {paso === "plataforma" && (
            <>
              <p className="text-xs text-zinc-300">
                Plataformas con credenciales configuradas para <strong>{empresa}</strong>:
              </p>
              <div className="space-y-2">
                {(["meta", "tiktok", "google"] as PlataformaAPI[]).map(p => {
                  const cfg       = PLAT_CONFIG[p];
                  const disponible = plataformas.includes(p);
                  const esGoogle  = p === "google";
                  return (
                    <button key={p}
                      disabled={!disponible || esGoogle}
                      onClick={() => { setPlataforma(p); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                        plataforma === p
                          ? `border-transparent ring-2 ring-blue-500 bg-blue-50`
                          : disponible && !esGoogle
                            ? "border-white/10 hover:border-white/15 hover:bg-zinc-800/40"
                            : "border-white/8 opacity-40 cursor-not-allowed"
                      }`}>
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{cfg.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-200">{cfg.label}</p>
                        <p className="text-[11px] text-zinc-400">
                          {esGoogle ? "Próximamente" : disponible ? cfg.description : "Sin credenciales configuradas"}
                        </p>
                      </div>
                      {plataforma === p && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button onClick={handlePreview} disabled={!plataforma || cargando}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-2">
                {cargando ? <><RefreshCw size={14} className="animate-spin" /> Consultando...</> : "Ver campañas disponibles"}
              </button>
            </>
          )}

          {/* PASO 3: Preview campañas */}
          {paso === "preview" && preview && plataforma && (
            <>
              <div className={`rounded-lg px-4 py-3 ${
                plataforma === "meta"   ? "bg-brand/5 border border-brand/20" :
                plataforma === "tiktok" ? "bg-pink-50 border border-pink-100" : ""
              }`}>
                <p className={`text-xs font-semibold mb-0.5 ${PLAT_CONFIG[plataforma].color}`}>
                  {preview.total} campaña{preview.total !== 1 ? "s" : ""} encontrada{preview.total !== 1 ? "s" : ""}
                </p>
                <p className={`text-xs ${PLAT_CONFIG[plataforma].color} opacity-70`}>
                  {empresa} · {desde} → {hasta}
                </p>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {preview.campanas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-800/40 rounded-lg text-xs">
                    <span className="text-zinc-300 font-medium truncate flex-1">
                      {c.campaign_name ?? c.name}
                    </span>
                    <span className="text-zinc-400 shrink-0 ml-3">
                      S/ {parseFloat(c.spend || "0").toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setPaso("plataforma"); setPreview(null); setError(null); }}
                  className="flex-1 py-2.5 border border-white/10 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800/40 transition">
                  Volver
                </button>
                <button onClick={handleSync} disabled={cargando}
                  className={`flex-1 py-2.5 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 ${PLAT_CONFIG[plataforma].bg} hover:opacity-90`}>
                  {cargando ? <><RefreshCw size={14} className="animate-spin" /> Importando...</> : "Importar al CRM"}
                </button>
              </div>
            </>
          )}

          {/* PASO 4: Éxito */}
          {paso === "exito" && resultado && (
            <>
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-200 mb-1">¡Importación completada!</p>
                <p className="text-xs text-zinc-300">
                  {resultado.insertados} campaña{resultado.insertados !== 1 ? "s" : ""} importada{resultado.insertados !== 1 ? "s" : ""}
                  {resultado.duplicados > 0 ? ` · ${resultado.duplicados} duplicada${resultado.duplicados !== 1 ? "s" : ""} omitida${resultado.duplicados !== 1 ? "s" : ""}` : ""}
                </p>
              </div>
              {resultado.campanas.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {resultado.campanas.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 px-3 py-1.5 bg-green-50 rounded-lg">
                      <CheckCircle size={12} className="text-green-500 shrink-0" /> {c}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={onCerrar}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition">
                Cerrar
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
