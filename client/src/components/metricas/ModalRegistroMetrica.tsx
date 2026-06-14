/** src/components/metricas/ModalRegistroMetrica.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import { useEffect }                    from "react";
import { FormMetrica, Plataforma }      from "../../types/metricas.types";
import { calcularDesdeForm }            from "../../utils/metricas.calc";

interface Props {
  form:         FormMetrica;
  cargando:     boolean;
  onFormChange: (f: FormMetrica) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

// ─── Campos del formulario ─────────────────────────────────────────────────────

const CAMPOS_ALCANCE = [
  { key: "impresiones", label: "Impresiones",  calculado: false },
  { key: "alcance",     label: "Alcance",      calculado: false },
  { key: "clics",       label: "Clics",        calculado: false },
  { key: "ctr",         label: "CTR (%)",      calculado: true  },
] as const;

const CAMPOS_COSTO = [
  { key: "gasto", label: "Gasto (S/)", calculado: false },
  { key: "cpc",   label: "CPC",        calculado: true  },
  { key: "cpm",   label: "CPM",        calculado: true  },
  { key: "cpa",   label: "CPA",        calculado: true  },
] as const;

const CAMPOS_RESULTADOS = [
  { key: "conversiones", label: "Conversiones", calculado: false },
  { key: "leads",        label: "Leads",        calculado: false },
  { key: "mensajes",     label: "Mensajes",     calculado: false },
  { key: "roas",         label: "ROAS",         calculado: true  },
  { key: "roi",          label: "ROI (%)",      calculado: true  },
  { key: "costo_por_lead", label: "Costo por lead",  calculado: true  }, // ← agregar

] as const;

const CAMPOS_INGRESOS = [
  { key: "ingresos",    label: "Ingresos (S/)",    calculado: false },
  { key: "costo_total", label: "Costo total (S/)", calculado: false },
] as const;

const CAMPOS_COMUNIDAD = [
  { key: "seguidores_ganados", label: "Seguidores ganados", calculado: false },
  { key: "perfil_visitas",     label: "Visitas al perfil",  calculado: false },
  { key: "frecuencia",         label: "Frecuencia",         calculado: true  },
] as const;

const CAMPOS_ENGAGEMENT = [
  { key: "interacciones",      label: "Interacciones",       calculado: false },
  { key: "me_gusta",           label: "Me gusta",            calculado: false },
  { key: "comentarios",        label: "Comentarios",         calculado: false },
  { key: "compartidos",        label: "Compartidos",         calculado: false },
  { key: "guardados",          label: "Guardados",           calculado: false },
  { key: "tasa_engagement",    label: "Tasa engagement (%)", calculado: false },
  { key: "costo_por_mensaje",  label: "Costo por mensaje",   calculado: true  },
] as const;

const CAMPOS_VIDEO = [
  { key: "reproducciones",    label: "Reproducciones",        calculado: false },
  { key: "tasa_reproduccion", label: "Tasa reproducción (%)", calculado: false },
] as const;

// ─── Sub componentes ───────────────────────────────────────────────────────────
const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{titulo}</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{children}</div>
  </div>
);

const Campo = ({
  label, value, onChange, calculado = false,
}: {
  label:      string;
  value:      string;
  onChange:   (v: string) => void;
  calculado?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">
      {label}
      {calculado && <span className="ml-1 text-accent font-bold">· auto</span>}
    </label>
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={calculado}
      className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none transition [color-scheme:dark] ${ calculado ? "bg-white/[0.02] border-white/[0.06] text-zinc-500 cursor-not-allowed" : "bg-white/[0.04] border-white/10 text-zinc-100 focus:ring-2 focus:ring-accent/30 focus:border-accent-30" }`}
      placeholder="0"
    />
  </div>
);

// ─── Componente principal ──────────────────────────────────────────────────────
export const ModalRegistroMetrica = ({
  form, cargando, onFormChange, onGuardar, onCerrar,
}: Props) => {
  const set = (key: keyof FormMetrica, value: string) =>
    onFormChange({ ...form, [key]: value });

  // ── Cálculo automático en tiempo real ────────────────────────────────────────
  useEffect(() => {
    const calculados = calcularDesdeForm(form as any);
    onFormChange({
      ...form,
      ctr:               calculados.ctr,
      cpc:               calculados.cpc,
      cpm:               calculados.cpm,
      cpa:               calculados.cpa,
      roas:              calculados.roas,
      roi:               calculados.roi,
      frecuencia:        calculados.frecuencia,
      costo_por_mensaje: calculados.costo_por_mensaje,
      costo_por_lead:    calculados.costo_por_lead,    // ← agregar
    });
  }, [
    form.impresiones, form.clics,    form.gasto,
    form.conversiones, form.ingresos, form.costo_total,
    form.alcance,      form.mensajes, form.leads,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[rgba(10,16,31,0.97)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-4 rounded-full bg-[rgb(var(--accent))] block shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Registrar métricas</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Campos marcados con <span className="text-accent font-bold">· auto</span> se calculan solos
              </p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-zinc-200 text-lg transition">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">

          {/* Empresa + Campaña + Objetivo */}
          <div className="rounded-2xl border border-white/10 bg-zinc-800 p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Empresa *</label>
              <input value={form.empresa} onChange={(e) => set("empresa", e.target.value)}
                className={`${INPUT_BASE} w-full bg-white/[0.04] border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent-30`}
                placeholder="Nombre de empresa" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Nombre campaña *</label>
              <input value={form.campana_nombre} onChange={(e) => set("campana_nombre", e.target.value)}
                className={`${INPUT_BASE} w-full bg-white/[0.04] border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent-30`}
                placeholder="Ej: Black Friday 2026" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Objetivo de la campaña</label>
              <div className="flex gap-2">
                {(["venta", "branding", "comunidad"] as const).map((obj) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => set("objetivo", obj)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${
                      form.objetivo === obj
                        ? obj === "venta"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : obj === "branding"
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                          : "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-white/[0.02] border-white/10 text-zinc-500 hover:border-zinc-500"
                    }`}
                  >
                    {obj === "venta" ? "Venta" : obj === "branding" ? "Branding" : "Comunidad"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Plataforma + Sub plataforma + Período */}
          <div className="rounded-2xl border border-white/10 bg-zinc-800 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Plataforma *</label>
              <select value={form.plataforma}
                onChange={(e) => onFormChange({ ...form, plataforma: e.target.value as Plataforma, sub_plataforma: "" })}
                className={`${INPUT_BASE} w-full border-white/10 px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-accent/30`}>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok Ads</option>
              </select>
            </div>

            {form.plataforma === "meta" && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Red social</label>
                <select value={form.sub_plataforma} onChange={(e) => set("sub_plataforma", e.target.value)}
                  className={`${INPUT_BASE} w-full border-white/10 px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-accent/30`}>
                  <option value="">Ambas</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="audience_network">Audience Network</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Período inicio *</label>
              <input type="date" value={form.periodo_inicio} onChange={(e) => set("periodo_inicio", e.target.value)}
                className={`${INPUT_BASE} w-full bg-white/[0.04] border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent/30 [color-scheme:dark]`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest block">Período fin *</label>
              <input type="date" value={form.periodo_fin} onChange={(e) => set("periodo_fin", e.target.value)}
                className={`${INPUT_BASE} w-full bg-white/[0.04] border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent/30 [color-scheme:dark]`} />
            </div>
          </div>

          {/* Alcance */}
          <Seccion titulo="📊 Alcance">
            {CAMPOS_ALCANCE.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Costo */}
          <Seccion titulo="💰 Costo">
            {CAMPOS_COSTO.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Ingresos — necesario para ROAS y ROI */}
          <Seccion titulo="📈 Ingresos y costos totales">
            {CAMPOS_INGRESOS.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Resultados */}
          <Seccion titulo="🎯 Resultados">
            {CAMPOS_RESULTADOS.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Comunidad */}
          <Seccion titulo="👥 Comunidad">
            {CAMPOS_COMUNIDAD.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Engagement */}
          <Seccion titulo="❤️ Engagement">
            {CAMPOS_ENGAGEMENT.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Video */}
          <Seccion titulo="🎥 Video">
            {CAMPOS_VIDEO.map(({ key, label, calculado }) => (
              <Campo key={key} label={label} value={form[key]} calculado={calculado} onChange={(v) => set(key, v)} />
            ))}
          </Seccion>

          {/* Notas */}
          <div>
            <label className="text-xs text-zinc-300 mb-1 block">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={2}
              className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none`}
              placeholder="Observaciones opcionales..."
            />
          </div>

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
            onClick={onGuardar}
            disabled={cargando}
            className="px-4 py-2 text-xs btn-primary rounded-lg transition disabled:opacity-50"
          >
            {cargando ? "Guardando..." : "Guardar métricas"}
          </button>
        </div>

      </div>
    </div>
  );
};