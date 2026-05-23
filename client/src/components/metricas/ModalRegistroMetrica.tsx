/** src/components/metricas/ModalRegistroMetrica.tsx */

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
  <div className="space-y-2">
    <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide">{titulo}</p>
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
  <div>
    <label className="text-xs text-zinc-700 mb-1 block">
      {label}
      {calculado && (
        <span className="ml-1 text-[10px] text-blue-400 font-normal">· auto</span>
      )}
    </label>
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={calculado}
      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none transition ${
        calculado
          ? "border-zinc-100 bg-zinc-50 text-zinc-600 cursor-not-allowed"
          : "border-zinc-200 focus:ring-2 focus:ring-brand/50"
      }`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800">Registrar métricas</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Los campos marcados con <span className="text-blue-400">· auto</span> se calculan solos
            </p>
          </div>
          <button onClick={onCerrar} className="text-zinc-600 hover:text-zinc-600 text-lg">✕</button>
        </div>

        <div className="px-6 py-4 space-y-5">

          {/* Empresa + Campaña */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-700 mb-1 block">Empresa *</label>
              <input
                value={form.empresa}
                onChange={(e) => set("empresa", e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="Nombre de empresa"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-700 mb-1 block">Nombre campaña *</label>
              <input
                value={form.campana_nombre}
                onChange={(e) => set("campana_nombre", e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="Ej: Black Friday 2026"
              />
            </div>
          </div>

          {/* Plataforma + Sub plataforma + Período */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-zinc-700 mb-1 block">Plataforma *</label>
              <select
                value={form.plataforma}
                onChange={(e) =>
                  onFormChange({ ...form, plataforma: e.target.value as Plataforma, sub_plataforma: "" })
                }
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok Ads</option>
              </select>
            </div>

            {form.plataforma === "meta" && (
              <div>
                <label className="text-xs text-zinc-700 mb-1 block">Red social</label>
                <select
                  value={form.sub_plataforma}
                  onChange={(e) => set("sub_plataforma", e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  <option value="">Ambas</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="audience_network">Audience Network</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-700 mb-1 block">Período inicio *</label>
              <input
                type="date" value={form.periodo_inicio}
                onChange={(e) => set("periodo_inicio", e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-700 mb-1 block">Período fin *</label>
              <input
                type="date" value={form.periodo_fin}
                onChange={(e) => set("periodo_fin", e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
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
            <label className="text-xs text-zinc-700 mb-1 block">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={2}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
              placeholder="Observaciones opcionales..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={cargando}
            className="px-4 py-2 text-xs bg-brand hover:bg-brand-hover text-white rounded-lg transition disabled:opacity-50"
          >
            {cargando ? "Guardando..." : "Guardar métricas"}
          </button>
        </div>

      </div>
    </div>
  );
};