/** client/src/pages/ConfiguracionPage.tsx — REDISEÑO NEON
 * Cambios SOLO de presentación. Lógica (CRUD cuentas, sync manual, renovar token TikTok,
 * alertas de vencimiento, semáforo) INTACTA.
 *
 * Migrado de tema claro → neon:
 *  - Header con kicker.
 *  - SemaforoToken: badges border-*-200 → chips translúcidos por color.
 *  - PLATAFORMAS: los botones usan color de MARCA (Meta azul/TikTok rosa/Google rojo) con glow.
 *  - Tabs filtro: bg-zinc-900 → acento.
 *  - Lista: hover:bg-white/8/5 (typo) → hover:bg-white/[0.03]; badges Activo/Inactivo neon;
 *    acciones sync/renovar/editar/eliminar neon.
 *  - Info footer: bg-zinc-50/50 → bg-white/[0.02].
 *  - Modales: borde, inputs focus:ring-brand → accent, botones bg-brand → color de marca,
 *    selector de plataforma, toggle Activo (bg-green-50 → neon), error (bg-red-50 → neon),
 *    panel TikTok (bg-pink-50 → neon).
 */

import { GLASS_BASE, MODAL_BASE, INPUT_BASE } from "../lib/tokens";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Play, Loader2 } from "lucide-react";
import { PlataformaCuenta, PlataformaCuentaForm, PlataformaAPI } from "../types/plataformaCuentas.types";
import {
  getPlataformaCuentas, createPlataformaCuenta,
  updatePlataformaCuenta, deletePlataformaCuenta, syncManualCuenta,
} from "../services/plataformaCuentas.api";
import api from "../services/api";

// ── Semáforo de token (neon) ───────────────────────────────────────────────────
function diasParaVencer(fecha?: string | null): number | null {
  if (!fecha) return null;
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fecha); vence.setHours(0, 0, 0, 0);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function chip(hex: string): React.CSSProperties {
  return { color: hex, background: `${hex}1a`, border: `1px solid ${hex}38` };
}

function SemaforoToken({ fecha }: { fecha?: string | null }) {
  const dias = diasParaVencer(fecha);
  if (dias === null) return null;

  if (dias < 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={chip("#f87171")}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Token vencido
    </span>
  );
  if (dias <= 5) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={chip("#fbbf24")}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" /> Vence en {dias}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={chip("#34d399")}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> Token vigente
    </span>
  );
}

// ── Config por plataforma (color de marca + hex para glow) ──────────────────────
const PLATAFORMAS: Record<PlataformaAPI, {
  label: string; hex: string;
  accountLabel: string; accountPlaceholder: string; accountHint: string;
  icon: string;
}> = {
  meta: {
    label: "Meta Ads", hex: "#3b82f6",
    accountLabel: "Ad Account ID", accountPlaceholder: "Ej: 1328625372336520",
    accountHint: "Solo el número, sin el prefijo \"act_\"",
    icon: "f",
  },
  tiktok: {
    label: "TikTok Ads", hex: "#ec4899",
    accountLabel: "Advertiser ID", accountPlaceholder: "Ej: 7012345678901234567",
    accountHint: "ID del anunciante de TikTok Business",
    icon: "T",
  },
  google: {
    label: "Google Ads", hex: "#ef4444",
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
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [verToken,    setVerToken]    = useState(false);
  const [sincronizando, setSincronizando] = useState<string | null>(null);
  const [syncMsg,     setSyncMsg]     = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [tabPlat,   setTabPlat]   = useState<PlataformaAPI | "todas">("todas");
  const [modalRenovar, setModalRenovar] = useState<PlataformaCuenta | null>(null);
  const [urlRedireccion, setUrlRedireccion] = useState("");
  const [renovando, setRenovando] = useState(false);
  const [authUrl, setAuthUrl] = useState("");

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

  const abrirRenovar = async (c: PlataformaCuenta) => {
    setUrlRedireccion("");
    setModalRenovar(c);
    try {
      const { data } = await api.get("/tiktok-ads/auth-url");
      setAuthUrl(data.url);
    } catch { setAuthUrl(""); }
  };

  const handleRenovar = async () => {
    if (!modalRenovar || !urlRedireccion) return;
    const match = urlRedireccion.match(/auth_code=([^&]+)/);
    if (!match) { alert("No se encontró auth_code en la URL. Asegúrate de pegar la URL completa después de autorizar."); return; }
    setRenovando(true);
    try {
      await api.post("/tiktok-ads/renew", { empresa: modalRenovar.empresa, auth_code: match[1] });
      setModalRenovar(null);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al renovar token");
    } finally { setRenovando(false); }
  };

  const handleEliminar = async (c: PlataformaCuenta) => {
    if (!confirm(`¿Eliminar la cuenta de ${PLATAFORMAS[c.plataforma].label} para "${c.empresa}"?`)) return;
    try { await deletePlataformaCuenta(c.id); cargar(); } catch {}
  };

  const handleSyncManual = async (c: PlataformaCuenta) => {
    setSincronizando(c.id);
    setSyncMsg(null);
    try {
      const res = await syncManualCuenta(c.empresa, c.plataforma);
      setSyncMsg({ id: c.id, msg: `✓ ${res.insertados ?? 0} nuevas, ${res.duplicados ?? 0} duplicadas`, ok: true });
      cargar();
    } catch (err: any) {
      setSyncMsg({ id: c.id, msg: err.response?.data?.message || "Error al sincronizar", ok: false });
    } finally {
      setSincronizando(null);
    }
  };

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
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Sistema</p>
        <h1 className="font-display text-xl font-bold text-zinc-50 tracking-tight mt-1">Configuración</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Gestiona las cuentas publicitarias conectadas al CRM</p>
      </div>

      {/* Alertas de tokens por vencer */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map(c => {
            const dias = diasParaVencer(c.token_vence_en)!;
            const hex = dias < 0 ? "#f87171" : "#fbbf24";
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: `${hex}0d`, border: `1px solid ${hex}33`, color: dias < 0 ? "#fca5a5" : "#fcd34d" }}>
                <AlertTriangle size={15} className="shrink-0" />
                <span className="text-zinc-300">
                  {dias < 0
                    ? <>El token de <strong className="text-zinc-100">{c.empresa}</strong> ({PLATAFORMAS[c.plataforma].label}) <strong style={{ color: hex }}>ya venció</strong>. Renuévalo para seguir importando métricas.</>
                    : <>El token de <strong className="text-zinc-100">{c.empresa}</strong> ({PLATAFORMAS[c.plataforma].label}) vence en <strong style={{ color: hex }}>{dias} día{dias !== 1 ? "s" : ""}</strong>.</>
                  }
                </span>
                <button onClick={() => abrirEditar(c)}
                  className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg shrink-0 transition"
                  style={{ background: `${hex}22`, color: hex }}>
                  Actualizar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Card cuentas API */}
      <div className={GLASS_BASE}>

        {/* Header card */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Cuentas publicitarias</p>
            <p className="text-[11px] text-zinc-500">Meta Ads · TikTok Ads · Google Ads</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["meta", "tiktok", "google"] as PlataformaAPI[]).map(p => (
              <button key={p} onClick={() => abrirNueva(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition hover:opacity-90"
                style={{ background: PLATAFORMAS[p].hex, boxShadow: `0 0 12px ${PLATAFORMAS[p].hex}55` }}>
                <Plus size={13} /> {PLATAFORMAS[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs filtro */}
        <div className="flex gap-1 px-6 pt-4 pb-0">
          {([["todas", "Todas"], ["meta", "Meta"], ["tiktok", "TikTok"], ["google", "Google"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setTabPlat(val)}
              className={`px-3 py-1.5 text-xs rounded-lg transition font-medium border ${
                tabPlat === val ? "bg-accent-15 text-accent border-accent-30" : "text-zinc-400 border-transparent hover:bg-white/[0.05]"
              }`}>
              {lbl} {val !== "todas" && `(${cuentas.filter(c => c.plataforma === val).length})`}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cuentasFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">No hay cuentas configuradas</p>
            <p className="text-xs text-zinc-500 mt-1">
              Agrega las credenciales de cada plataforma para sincronizar campañas automáticamente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] mt-3">
            {cuentasFiltradas.map(c => {
              const p        = PLATAFORMAS[c.plataforma];
              const sincing  = sincronizando === c.id;
              const msg      = syncMsg?.id === c.id ? syncMsg : null;
              return (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: p.hex, boxShadow: `0 0 10px ${p.hex}66` }}>
                      <span className="text-white text-xs font-bold">{p.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-zinc-100">{c.empresa}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={chip(p.hex)}>
                          {p.label}
                        </span>
                        <SemaforoToken fecha={c.token_vence_en} />
                        {c.sync_error && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={chip("#f87171")} title={c.sync_error}>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> Error sync
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{c.account_id}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">
                        {c.ultimo_sync
                          ? <>Último sync: {new Date(c.ultimo_sync).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                          : "Sin sync previo — sync diario a las 2:00 am"
                        }
                      </p>
                      {msg && (
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: msg.ok ? "#34d399" : "#f87171" }}>
                          {msg.msg}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={c.activo ? { color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" } : { color: "#a1a1aa", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>

                    {c.activo && (
                      <button onClick={() => handleSyncManual(c)} disabled={sincing}
                        title="Sincronizar ahora (últimos 30 días)"
                        className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition disabled:opacity-40">
                        {sincing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                      </button>
                    )}

                    {c.plataforma === "tiktok" && (
                      <button onClick={() => abrirRenovar(c)} title="Renovar token TikTok"
                        className="p-1.5 text-pink-400 hover:bg-pink-500/10 rounded-lg transition">
                        <RefreshCw size={13} />
                      </button>
                    )}
                    <button onClick={() => abrirEditar(c)}
                      className="p-1.5 text-zinc-500 hover:text-accent hover:bg-white/5 rounded-lg transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleEliminar(c)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-white/[0.02] rounded-b-2xl mt-2">
          <p className="text-[11px] text-zinc-500">
            El CRM sincroniza automáticamente todas las cuentas activas <strong className="text-zinc-300">cada día a las 2:00 am</strong> (últimos 30 días).
            Usa el botón <span className="inline-flex items-center gap-1 align-middle text-violet-400"><Play size={10} /> sync</span> para forzar una sincronización manual.
            Si no hay cuenta configurada, usa las variables del archivo <code className="bg-white/[0.06] px-1 rounded">.env</code>.
          </p>
        </div>
      </div>

      {/* Modal nueva/editar cuenta */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`${MODAL_BASE} w-full max-w-md`}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.hex, boxShadow: `0 0 10px ${cfg.hex}66` }}>
                  <span className="text-white text-xs font-bold">{cfg.icon}</span>
                </div>
                <h2 className="text-sm font-semibold text-zinc-200">
                  {editando ? `Editar cuenta · ${cfg.label}` : `Nueva cuenta · ${cfg.label}`}
                </h2>
              </div>
              <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Plataforma (solo al crear) */}
              {!editando && (
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Plataforma</label>
                  <div className="flex gap-2">
                    {(["meta", "tiktok", "google"] as PlataformaAPI[]).map(p => {
                      const sel = form.plataforma === p;
                      return (
                        <button key={p} type="button" onClick={() => set("plataforma", p)}
                          className="flex-1 py-2 text-xs font-medium rounded-lg border transition text-white"
                          style={sel
                            ? { background: PLATAFORMAS[p].hex, borderColor: "transparent", boxShadow: `0 0 12px ${PLATAFORMAS[p].hex}55` }
                            : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "#a1a1aa" }}>
                          {PLATAFORMAS[p].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Empresa / Cliente *</label>
                <input value={form.empresa} onChange={e => set("empresa", e.target.value)}
                  placeholder="Ej: Codeli, Zincel Ideas"
                  className="neon-input w-full px-3 py-2 text-xs" />
                <p className="text-[10px] text-zinc-500 mt-1">Debe coincidir exactamente con el nombre en las métricas</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">{cfg.accountLabel} *</label>
                <input value={form.account_id} onChange={e => set("account_id", e.target.value)}
                  placeholder={cfg.accountPlaceholder}
                  className="neon-input w-full px-3 py-2 text-xs font-mono" />
                <p className="text-[10px] text-zinc-500 mt-1">{cfg.accountHint}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">
                  Access Token {editando ? "(vacío = no cambiar)" : "*"}
                </label>
                <div className="relative">
                  <input type={verToken ? "text" : "password"}
                    value={form.access_token} onChange={e => set("access_token", e.target.value)}
                    placeholder={editando ? "••••••• (sin cambios si está vacío)" : "Token de acceso..."}
                    className="neon-input w-full px-3 py-2 pr-10 text-xs font-mono" />
                  <button type="button" onClick={() => setVerToken(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {verToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Fecha de vencimiento del token</label>
                <input type="date" value={form.token_vence_en}
                  onChange={e => set("token_vence_en", e.target.value)}
                  className="neon-input w-full px-3 py-2 text-xs" />
                <p className="text-[10px] text-zinc-500 mt-1">El CRM te alertará 5 días antes del vencimiento</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Notas (opcional)</label>
                <input value={form.notas} onChange={e => set("notas", e.target.value)}
                  placeholder="Ej: Token de sistema, creado por cuenta principal"
                  className="neon-input w-full px-3 py-2 text-xs" />
              </div>

              <button type="button" onClick={() => set("activo", !form.activo)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition"
                style={form.activo
                  ? { background: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.3)", color: "#34d399" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#a1a1aa" }}>
                {form.activo ? <><CheckCircle size={13} /> Activo</> : <><XCircle size={13} /> Inactivo</>}
              </button>

              {error && (
                <p className="text-xs text-red-300 rounded-lg px-3 py-2" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)" }}>{error}</p>
              )}
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-white/[0.08]">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2 text-xs text-zinc-300 border border-white/10 rounded-lg hover:bg-white/5 transition">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className="flex-1 py-2 text-xs text-white font-semibold rounded-lg transition disabled:opacity-50 hover:opacity-90"
                style={{ background: cfg.hex, boxShadow: `0 0 12px ${cfg.hex}55` }}>
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal renovar token TikTok */}
      {modalRenovar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`${MODAL_BASE} w-full max-w-md`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ec4899", boxShadow: "0 0 10px #ec489966" }}>
                  <RefreshCw size={13} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-200">Renovar Token · TikTok Ads</h2>
              </div>
              <button onClick={() => setModalRenovar(null)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.25)", color: "#f9a8d4" }}>
                <p className="font-semibold">Cuenta: {modalRenovar.empresa}</p>
                <p>El token de TikTok vence cada 24 horas. Sigue estos pasos para renovarlo:</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#ec4899" }}>1</span>
                  <div>
                    <p className="text-xs text-zinc-200 font-medium">Autoriza la app en TikTok</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Abre el enlace y acepta los permisos con tu cuenta.</p>
                    {authUrl && (
                      <a href={authUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300">
                        <ExternalLink size={11} /> Abrir TikTok Authorization
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#ec4899" }}>2</span>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-200 font-medium">Pega la URL de redirección</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Después de autorizar, copia la URL completa del navegador y pégala aquí.</p>
                    <textarea value={urlRedireccion} onChange={e => setUrlRedireccion(e.target.value)}
                      placeholder="https://www.zincelideas.com/?auth_code=..."
                      rows={2}
                      className="neon-input w-full mt-2 px-3 py-2 text-xs resize-none font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-white/[0.08]">
              <button onClick={() => setModalRenovar(null)}
                className="flex-1 py-2 text-xs text-zinc-300 border border-white/10 rounded-lg hover:bg-white/5 transition">
                Cancelar
              </button>
              <button onClick={handleRenovar} disabled={renovando || !urlRedireccion}
                className="flex-1 py-2 text-xs text-white font-semibold rounded-lg transition disabled:opacity-50 hover:opacity-90"
                style={{ background: "#ec4899", boxShadow: "0 0 12px #ec489955" }}>
                {renovando ? "Renovando..." : "Renovar Token"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}