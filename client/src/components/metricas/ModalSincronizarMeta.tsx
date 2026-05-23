/** client/src/components/metricas/ModalSincronizarMeta.tsx */

import { useState } from "react";
import { X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { previewMetaAds, syncMetaAds } from "../../services/metaAds.api";
import { fechaHoy } from "../../utils/date";

interface Props {
  onCerrar:       () => void;
  onSincronizado: () => void;
  empresaPrefill?: string;
}

const hoy    = () => fechaHoy();
const hace30 = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Paso = "form" | "preview" | "exito";

export function ModalSincronizarMeta({ onCerrar, onSincronizado, empresaPrefill }: Props) {
  const [empresa, setEmpresa]   = useState(empresaPrefill ?? "");
  const [desde,   setDesde]     = useState(hace30());
  const [hasta,   setHasta]     = useState(hoy());
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [paso,     setPaso]     = useState<Paso>("form");
  const [preview,  setPreview]  = useState<{ total: number; campanas: any[] } | null>(null);
  const [resultado, setResultado] = useState<{ insertados: number; duplicados: number; campanas: string[] } | null>(null);

  async function handlePreview() {
    if (!empresa.trim()) { setError("Ingresa el nombre de la empresa"); return; }
    if (!desde || !hasta) { setError("Selecciona el rango de fechas"); return; }
    setError(null);
    setCargando(true);
    try {
      const data = await previewMetaAds(empresa, desde, hasta);
      setPreview(data);
      setPaso("preview");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error conectando con Meta Ads API");
    } finally {
      setCargando(false);
    }
  }

  async function handleSync() {
    setError(null);
    setCargando(true);
    try {
      const data = await syncMetaAds(empresa, desde, hasta);
      setResultado(data);
      setPaso("exito");
      onSincronizado();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al sincronizar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">f</span>
            </div>
            <h2 className="text-sm font-semibold text-zinc-800">Sincronizar Meta Ads</h2>
          </div>
          <button onClick={onCerrar} className="text-zinc-600 hover:text-zinc-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* PASO: formulario */}
          {paso === "form" && (
            <>
              <p className="text-xs text-zinc-700">
                Importa las métricas de tus campañas directamente desde tu cuenta de Meta Ads.
              </p>

              {empresaPrefill ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-600">
                  Empresa: <strong>{empresaPrefill}</strong>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Empresa / cliente</label>
                  <input
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    placeholder="Ej: Zincel Ideas"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={desde}
                    onChange={e => setDesde(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={hasta}
                    onChange={e => setHasta(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={cargando}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cargando ? <><RefreshCw size={14} className="animate-spin" /> Consultando Meta...</> : "Ver campañas disponibles"}
              </button>
            </>
          )}

          {/* PASO: preview */}
          {paso === "preview" && preview && (
            <>
              <div className="bg-brand/5 border border-brand/20 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-0.5">
                  {preview.total} campaña{preview.total !== 1 ? "s" : ""} encontrada{preview.total !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-blue-500">Empresa: <strong>{empresa}</strong> · {desde} → {hasta}</p>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {preview.campanas.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                    <span className="text-zinc-700 font-medium truncate flex-1">{c.campaign_name}</span>
                    <span className="text-zinc-600 shrink-0 ml-3">
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
                <button
                  onClick={() => { setPaso("form"); setPreview(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-zinc-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Volver
                </button>
                <button
                  onClick={handleSync}
                  disabled={cargando}
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cargando ? <><RefreshCw size={14} className="animate-spin" /> Importando...</> : "Importar al CRM"}
                </button>
              </div>
            </>
          )}

          {/* PASO: éxito */}
          {paso === "exito" && resultado && (
            <>
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-800 mb-1">¡Sincronización completada!</p>
                <p className="text-xs text-zinc-700">
                  {resultado.insertados} campaña{resultado.insertados !== 1 ? "s" : ""} importada{resultado.insertados !== 1 ? "s" : ""}
                  {resultado.duplicados > 0 ? ` · ${resultado.duplicados} duplicada${resultado.duplicados !== 1 ? "s" : ""} omitida${resultado.duplicados !== 1 ? "s" : ""}` : ""}
                </p>
              </div>

              {resultado.campanas.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {resultado.campanas.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 px-3 py-1.5 bg-green-50 rounded-lg">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={onCerrar}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Cerrar
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
