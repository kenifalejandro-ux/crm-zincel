/** client/src/components/finanzas/ModalEgreso.tsx */

import { MODAL_BASE, INPUT_BASE } from "../../lib/tokens";
import type { FormEgreso, CategoriaEgreso, FrecuenciaEgreso, EstadoEgreso, Moneda } from "../../types/finanzas.types";

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

const CATEGORIAS: { value: CategoriaEgreso; label: string }[] = [
  { value: "publicidad_digital",      label: "Publicidad digital" },
  { value: "herramientas_saas",       label: "Herramientas & SaaS" },
  { value: "herramientas_ia",         label: "Herramientas IA" },
  { value: "infraestructura_digital", label: "Infraestructura digital" },
  { value: "subcontratos",            label: "Subcontratos" },
];

const PLACEHOLDERS: Record<CategoriaEgreso, string> = {
  publicidad_digital:      "Ej: Campaña Meta Ads mayo, pauta TikTok...",
  herramientas_saas:       "Ej: Adobe Creative Cloud, Semrush, Make...",
  herramientas_ia:         "Ej: ChatGPT Plus, Claude Pro, Grok, Gemini...",
  infraestructura_digital: "Ej: Hosting mensual, renovación de dominio, VPS...",
  subcontratos:            "Ej: Diseño de piezas gráficas, edición de video...",
};

const PROVEEDORES: Record<CategoriaEgreso, string[]> = {
  publicidad_digital:      ["Meta Ads", "TikTok Ads", "Google Ads", "LinkedIn Ads", "YouTube Ads", "Pinterest Ads", "Twitter / X Ads"],
  herramientas_saas:       ["Adobe Creative Cloud", "Canva", "Figma", "Semrush", "Make", "Zapier", "Notion", "HubSpot", "Buffer", "Hootsuite"],
  herramientas_ia:         ["OpenAI (ChatGPT)", "Anthropic (Claude)", "Google (Gemini)", "xAI (Grok)", "Midjourney", "ElevenLabs", "Perplexity", "Runway", "Sora"],
  infraestructura_digital: ["SG-Host", "Namecheap", "Cloudflare", "DigitalOcean", "AWS", "GoDaddy", "Hostinger", "Vercel", "Netlify"],
  subcontratos:            ["Freelancer diseño gráfico", "Freelancer edición de video", "Freelancer desarrollo web", "Freelancer redacción", "Agencia externa", "Consultor estratégico"],
};

const FRECUENCIAS: { value: FrecuenciaEgreso; label: string }[] = [
  { value: "unico",   label: "Único (pago único)" },
  { value: "mensual", label: "Mensual (recurrente)" },
  { value: "anual",   label: "Anual (recurrente)" },
];

interface Props {
  form:         FormEgreso;
  cargando:     boolean;
  onFormChange: (form: FormEgreso) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalEgreso({ form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormEgreso>) => onFormChange({ ...form, ...campo });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className={`${MODAL_BASE} w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto`}>
        <h2 className="text-base font-semibold text-zinc-200">Registrar egreso</h2>

        {/* Categoría */}
        <div>
          <label className="text-xs font-medium text-gray-300 mb-1 block">Categoría</label>
          <select value={form.categoria}
            onChange={(e) => set({ categoria: e.target.value as CategoriaEgreso, proveedor: "" })}
            className={cls}>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Descripción + Proveedor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Descripción</label>
            <input type="text" value={form.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              placeholder={PLACEHOLDERS[form.categoria]} className={cls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">
              Proveedor <span className="text-zinc-400">(opcional)</span>
            </label>
            <select value={form.proveedor}
              onChange={(e) => set({ proveedor: e.target.value })}
              className={cls}>
              <option value="">— Selecciona proveedor —</option>
              {PROVEEDORES[form.categoria].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Moneda + Monto */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Moneda</label>
            <select value={form.moneda}
              onChange={(e) => set({ moneda: e.target.value as Moneda })}
              className={cls}>
              <option value="PEN">S/ (PEN)</option>
              <option value="USD">$ (USD)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-300 mb-1 block">Monto</label>
            <input type="number" min={0} step="0.01" value={form.monto}
              onChange={(e) => set({ monto: e.target.value })}
              placeholder="0.00" className={cls} />
          </div>
        </div>

        {/* TC histórico — solo si USD */}
        {form.moneda === "USD" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs">
            <span className="text-amber-700 font-medium">TC al registrar:</span>
            <span className="text-amber-600">S/</span>
            <input type="number" min={1} step={0.01} value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              className={`${INPUT_BASE} w-20 px-2 py-1 border-amber-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-400`} />
            <span className="text-amber-600">/ USD</span>
            <span className="text-amber-500 ml-auto">Se guarda con el registro</span>
          </div>
        )}

        {/* Frecuencia + Estado */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Frecuencia</label>
            <select value={form.frecuencia}
              onChange={(e) => set({ frecuencia: e.target.value as FrecuenciaEgreso })}
              className={cls}>
              {FRECUENCIAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Estado</label>
            <select value={form.estado}
              onChange={(e) => set({ estado: e.target.value as EstadoEgreso })}
              className={cls}>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
        </div>

        {/* Fecha + Vencimiento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Fecha del egreso</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">
              Fecha de vencimiento <span className="text-zinc-400">(renovación/cancelación)</span>
            </label>
            <input type="date" value={form.fecha_vencimiento}
              onChange={(e) => set({ fecha_vencimiento: e.target.value })}
              className={cls} />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-300 mb-1 block">Notas</label>
          <textarea rows={2} value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
            className={`${cls} resize-none`} />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 text-xs border border-white/10 rounded-lg hover:bg-zinc-800/40 text-gray-400 transition">
            Cancelar
          </button>
          <button onClick={onGuardar}
            disabled={cargando || !form.descripcion || !form.monto}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition">
            {cargando ? "Guardando..." : "Guardar egreso"}
          </button>
        </div>
      </div>
    </div>
  );
}
