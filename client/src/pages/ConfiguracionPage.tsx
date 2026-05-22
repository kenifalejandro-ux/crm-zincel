/** client/src/pages/ConfiguracionPage.tsx */

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { PlataformaCuenta, PlataformaCuentaForm, PlataformaAPI } from "../types/plataformaCuentas.types";
import {
  getPlataformaCuentas, createPlataformaCuenta,
  updatePlataformaCuenta, deletePlataformaCuenta,
} from "../services/plataformaCuentas.api";

// ── Semáforo de token ─────────────────────────────────────────────────────────
function diasParaVencer(fecha?: string | null): number | null {
  if (!fecha) return null;
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fecha); vence.setHours(0, 0, 0, 0);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function SemaforoToken({ fecha }: { fecha?: string | null }) {
  const dias = diasParaVencer(fecha);
  if (dias === null) return null;

  if (dias < 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      Token vencido
    </span>
  );
  if (dias <= 5) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      Vence en {dias}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
      Token vigente
    </span>
  );
}

// ── Config por plataforma ─────────────────────────────────────────────────────
const PLATAFORMAS: Record<PlataformaAPI, {
  label: string; color: string; bg: string; border: string;
  accountLabel: string; accountPlaceholder: string; accountHint: string;
  icon: string;
}> = {
  meta: {
    label: "Meta Ads", color: "text-white", bg: "bg-brand",
    border: "border-blue-200",
    accountLabel: "Ad Account ID", accountPlaceholder: "Ej: 1328625372336520",
    accountHint: "Solo el número, sin el prefijo \"act_\"",
    icon: "f",
  },
  tiktok: {
    label: "TikTok Ads", color: "text-pink-700", bg: "bg-pink-500",
    border: "border-pink-200",
    accountLabel: "Advertiser ID", accountPlaceholder: "Ej: 7012345678901234567",
    accountHint: "ID del anunciante de TikTok Business",
    icon: "T",
  },
  google: {
    label: "Google Ads", color: "text-red-700", bg: "bg-red-500",
    border: "border-red-200",
    accountLabel: "Customer ID", accountPlaceholder: "Ej: 123-456-7890",
    accountHint: "ID de cliente de Google Ads (sin guiones)",
    icon: "G",
  },
};

const FORM_VACIO: PlataformaCuentaForm = {
  empresa: "", plataforma: "meta", account_id: "",
  access_token: "", activo: true, notas: "", token_vence_en: "",
};

export default function ConfiguracionPage() {
  const [cuentas,   setCuentas]   = useState<PlataformaCuenta[]>([]);
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState<PlataformaCuenta | null>(null);
  const [form,      setForm]      = useState<PlataformaCuentaForm>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [verToken,  setVerToken]  = useState(false);
  const [tabPlat,   setTabPlat]   = useState<PlataformaAPI | "todas">("todas");

  const cargar = async () => {
    try { setCuentas(await getPlataformaCuentas()); } catch {}
  };

  useEffect(() => { cargar(); }, []);

  const set = (key: keyof PlataformaCuentaForm, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const abrirNueva = (plataforma: PlataformaAPI = "meta") => {
    setEditando(null);
    setForm({ ...FORM_VACIO, plataforma });
    setError(null); setVerToken(false); setModal(true);
  };

  const abrirEditar = (c: PlataformaCuenta) => {
    setEditando(c);
    setForm({
      empresa: c.empresa, plataforma: c.plataforma, account_id: c.account_id,
      access_token: "", activo: c.activo, notas: c.notas ?? "",
      token_vence_en: c.token_vence_en ? c.token_vence_en.split("T")[0] : "",
    });
    setError(null); setVerToken(false); setModal(true);
  };

  const handleGuardar = async () => {
    if (!form.empresa || !form.account_id) { setError("Empresa y Account ID son obligatorios"); return; }
    if (!editando && !form.access_token)   { setError("El Access Token es obligatorio al crear"); return; }
    setError(null); setGuardando(true);
    try {
      if (editando) {
        const payload: Partial<PlataformaCuentaForm> = {
          empresa: form.empresa, account_id: form.account_id,
          activo: form.activo, notas: form.notas,
          token_vence_en: form.token_vence_en || "",
        };
        if (form.access_token) payload.access_token = form.access_token;
        await updatePlataformaCuenta(editando.id, payload);
      } else {
        await createPlataformaCuenta({ ...form, token_vence_en: form.token_vence_en || "" });
      }
      setModal(false); cargar();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (c: PlataformaCuenta) => {
    if (!confirm(`¿Eliminar la cuenta de ${PLATAFORMAS[c.plataforma].label} para "${c.empresa}"?`)) return;
    try { await deletePlataformaCuenta(c.id); cargar(); } catch {}
  };

  // Alertas globales de tokens próximos a vencer
  const alertas = cuentas.filter(c => {
    const dias = diasParaVencer(c.token_vence_en);
    return dias !== null && dias <= 5;
  });

  const cuentasFiltradas = tabPlat === "todas"
    ? cuentas
    : cuentas.filter(c => c.plataforma === tabPlat);

  const cfg = PLATAFORMAS[form.plataforma];

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-800">Configuración</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Gestiona las cuentas publicitarias conectadas al CRM</p>
      </div>

      {/* Alertas de tokens por vencer */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map(c => {
            const dias = diasParaVencer(c.token_vence_en)!;
            return (
              <div key={c.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                dias < 0
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  {dias < 0
                    ? <>El token de <strong>{c.empresa}</strong> ({PLATAFORMAS[c.plataforma].label}) <strong>ya venció</strong>. Renuévalo para seguir importando métricas.</>
                    : <>El token de <strong>{c.empresa}</strong> ({PLATAFORMAS[c.plataforma].label}) vence en <strong>{dias} día{dias !== 1 ? "s" : ""}</strong>.</>
                  }
                </span>
                <button onClick={() => abrirEditar(c)}
                  className={`ml-auto text-xs font-semibold px-3 py-1 rounded-lg shrink-0 ${
                    dias < 0 ? "bg-red-100 hover:bg-red-200 text-red-700" : "bg-amber-100 hover:bg-amber-200 text-amber-800"
                  } transition`}>
                  Actualizar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Card cuentas API */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm">

        {/* Header card */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-sm font-semibold text-zinc-800">Cuentas publicitarias</p>
            <p className="text-[11px] text-zinc-400">Meta Ads · TikTok Ads · Google Ads</p>
          </div>
          <div className="flex gap-2">
            {(["meta", "tiktok", "google"] as PlataformaAPI[]).map(p => (
              <button key={p} onClick={() => abrirNueva(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition ${PLATAFORMAS[p].bg} hover:opacity-90`}>
                <Plus size={13} /> {PLATAFORMAS[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs filtro */}
        <div className="flex gap-1 px-6 pt-4 pb-0">
          {([["todas", "Todas"], ["meta", "Meta"], ["tiktok", "TikTok"], ["google", "Google"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setTabPlat(val)}
              className={`px-3 py-1.5 text-xs rounded-lg transition ${
                tabPlat === val ? "bg-zinc-900 text-white font-medium" : "text-zinc-500 hover:bg-zinc-100"
              }`}>
              {lbl} {val !== "todas" && `(${cuentas.filter(c => c.plataforma === val).length})`}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cuentasFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">No hay cuentas configuradas</p>
            <p className="text-xs text-zinc-300 mt-1">
              Agrega las credenciales de cada plataforma para sincronizar campañas automáticamente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50 mt-3">
            {cuentasFiltradas.map(c => {
              const p = PLATAFORMAS[c.plataforma];
              return (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50/60 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg ${p.bg} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{p.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-zinc-800">{c.empresa}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${p.color} ${p.border} bg-white`}>
                          {p.label}
                        </span>
                        <SemaforoToken fecha={c.token_vence_en} />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{c.account_id}</p>
                      {c.token_vence_en && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Vence: {new Date(c.token_vence_en).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                      {c.notas && <p className="text-[11px] text-zinc-400">{c.notas}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      c.activo ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-400"
                    }`}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                    <button onClick={() => abrirEditar(c)}
                      className="p-1.5 text-zinc-400 hover:text-brand hover:bg-brand/5 rounded-lg transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleEliminar(c)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="px-6 py-3 border-t border-zinc-50 bg-zinc-50/50 rounded-b-2xl mt-2">
          <p className="text-[11px] text-zinc-400">
            Al importar métricas, el CRM usa automáticamente las credenciales registradas aquí según la empresa y plataforma.
            Si no hay cuenta configurada, usa las del archivo <code className="bg-zinc-100 px-1 rounded">.env</code>.
          </p>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{cfg.icon}</span>
                </div>
                <h2 className="text-sm font-semibold text-zinc-800">
                  {editando ? `Editar cuenta · ${cfg.label}` : `Nueva cuenta · ${cfg.label}`}
                </h2>
              </div>
              <button onClick={() => setModal(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Plataforma (solo al crear) */}
              {!editando && (
                <div>
                  <label className="text-xs font-medium text-zinc-600 mb-1 block">Plataforma</label>
                  <div className="flex gap-2">
                    {(["meta", "tiktok", "google"] as PlataformaAPI[]).map(p => (
                      <button key={p} type="button" onClick={() => set("plataforma", p)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${
                          form.plataforma === p
                            ? `${PLATAFORMAS[p].bg} text-white border-transparent`
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}>
                        {PLATAFORMAS[p].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1 block">Empresa / Cliente *</label>
                <input value={form.empresa} onChange={e => set("empresa", e.target.value)}
                  placeholder="Ej: Codeli, Zincel Ideas"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50" />
                <p className="text-[10px] text-zinc-400 mt-1">Debe coincidir exactamente con el nombre en las métricas</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1 block">{cfg.accountLabel} *</label>
                <input value={form.account_id} onChange={e => set("account_id", e.target.value)}
                  placeholder={cfg.accountPlaceholder}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/50" />
                <p className="text-[10px] text-zinc-400 mt-1">{cfg.accountHint}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1 block">
                  Access Token {editando ? "(vacío = no cambiar)" : "*"}
                </label>
                <div className="relative">
                  <input type={verToken ? "text" : "password"}
                    value={form.access_token} onChange={e => set("access_token", e.target.value)}
                    placeholder={editando ? "••••••• (sin cambios si está vacío)" : "Token de acceso..."}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 pr-10 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/50" />
                  <button type="button" onClick={() => setVerToken(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {verToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Fecha de vencimiento del token */}
              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1 block">
                  Fecha de vencimiento del token
                </label>
                <input
                  type="date"
                  value={form.token_vence_en}
                  onChange={e => set("token_vence_en", e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  El CRM te alertará 5 días antes del vencimiento
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 mb-1 block">Notas (opcional)</label>
                <input value={form.notas} onChange={e => set("notas", e.target.value)}
                  placeholder="Ej: Token de sistema, creado por cuenta principal"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50" />
              </div>

              <button type="button" onClick={() => set("activo", !form.activo)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                  form.activo ? "bg-green-50 border-green-200 text-green-700" : "bg-zinc-50 border-zinc-200 text-zinc-500"
                }`}>
                {form.activo ? <><CheckCircle size={13} /> Activo</> : <><XCircle size={13} /> Inactivo</>}
              </button>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-zinc-100">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2 text-xs text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className={`flex-1 py-2 text-xs text-white font-semibold rounded-lg transition disabled:opacity-50 ${cfg.bg} hover:opacity-90`}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
