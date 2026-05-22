/** client/src/components/finanzas/ModalPrestamo.tsx */

import type { FormPrestamo, CategoriaPrestamo, EstadoPrestamo, Moneda } from "../../types/finanzas.types";

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

const CATEGORIAS: { value: CategoriaPrestamo; label: string; desc: string }[] = [
  { value: "herramientas_ia",         label: "Herramientas IA",         desc: "ChatGPT, Claude, Grok..." },
  { value: "infraestructura_digital", label: "Infraestructura digital", desc: "Hosting, dominio, VPS..." },
  { value: "publicidad_digital",      label: "Publicidad digital",      desc: "Meta Ads, TikTok Ads..." },
  { value: "herramientas_saas",       label: "Herramientas & SaaS",     desc: "Adobe, Semrush, Make..." },
  { value: "subcontratos",            label: "Subcontratos",            desc: "Freelancers, agencias..." },
  { value: "personal",                label: "Personal",                desc: "Préstamo personal" },
  { value: "otro",                    label: "Otro",                    desc: "Otro motivo" },
];

interface Props {
  form:         FormPrestamo;
  cargando:     boolean;
  onFormChange: (form: FormPrestamo) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalPrestamo({ form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormPrestamo>) => onFormChange({ ...form, ...campo });
  const catActual = CATEGORIAS.find((c) => c.value === form.categoria);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-base font-semibold text-zinc-800">Registrar préstamo</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Dinero que recibiste prestado y debes devolver</p>
        </div>

        {/* Categoría */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">¿Para qué fue el préstamo?</label>
          <select value={form.categoria}
            onChange={(e) => set({ categoria: e.target.value as CategoriaPrestamo })}
            className={cls}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>
            ))}
          </select>
          {catActual && (
            <p className="text-[11px] text-zinc-400 mt-1">Ej: {catActual.desc}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Detalle del préstamo</label>
          <input type="text" value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
            placeholder="Ej: Para pagar suscripción Claude Pro de mayo..."
            className={cls} />
        </div>

        {/* Prestamista */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            ¿A quién le debes? <span className="text-zinc-400">(opcional)</span>
          </label>
          <input type="text" value={form.prestamista}
            onChange={(e) => set({ prestamista: e.target.value })}
            placeholder="Ej: Nombre de la persona, banco o entidad..."
            className={cls} />
        </div>

        {/* Moneda + Monto */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Moneda</label>
            <select value={form.moneda}
              onChange={(e) => set({ moneda: e.target.value as Moneda })}
              className={cls}>
              <option value="PEN">S/ (PEN)</option>
              <option value="USD">$ (USD)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Monto prestado</label>
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
              className="w-20 px-2 py-1 border border-amber-200 rounded text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
            <span className="text-amber-600">/ USD</span>
            <span className="text-amber-500 ml-auto">Se guarda con el registro</span>
          </div>
        )}

        {/* Estado + Fecha préstamo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
            <select value={form.estado}
              onChange={(e) => set({ estado: e.target.value as EstadoPrestamo })}
              className={cls}>
              <option value="por_pagar">Por pagar</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha del préstamo</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
        </div>

        {/* Fecha de vencimiento */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Fecha de vencimiento <span className="text-zinc-400">(¿cuándo debes devolverlo?)</span>
          </label>
          <input type="date" value={form.fecha_vencimiento}
            onChange={(e) => set({ fecha_vencimiento: e.target.value })}
            className={cls} />
          <p className="text-[11px] text-zinc-400 mt-1">
            Si pasa esta fecha sin pagar, el sistema lo marcará como vencido automáticamente.
          </p>
        </div>

        {/* Fecha de pago */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Fecha de pago <span className="text-zinc-400">(opcional — si ya lo pagaste)</span>
          </label>
          <input type="date" value={form.fecha_pago}
            onChange={(e) => set({ fecha_pago: e.target.value })}
            className={cls} />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea rows={2} value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
            className={`${cls} resize-none`} />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
            Cancelar
          </button>
          <button onClick={onGuardar}
            disabled={cargando || !form.descripcion || !form.monto}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition">
            {cargando ? "Guardando..." : "Guardar préstamo"}
          </button>
        </div>
      </div>
    </div>
  );
}
