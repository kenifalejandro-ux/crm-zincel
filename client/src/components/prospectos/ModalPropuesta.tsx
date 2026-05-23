/** client/src/components/propuestas/ModalPropuesta.tsx */

import type { FormPropuesta, ServicioPropuesta, EstadoPropuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO } from "../../types/propuesta.types";

const SERVICIOS = Object.keys(LABEL_SERVICIO) as ServicioPropuesta[];
const ESTADOS   = Object.keys(LABEL_ESTADO)   as EstadoPropuesta[];

interface Props {
  form:         FormPropuesta;
  cargando:     boolean;
  onFormChange: (form: FormPropuesta) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalPropuesta({ form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormPropuesta>) => onFormChange({ ...form, ...campo });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-zinc-800">Nueva propuesta</h2>

        {/* Servicio */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo de servicio</label>
          <select
            value={form.servicio}
            onChange={(e) => set({ servicio: e.target.value as ServicioPropuesta })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            {SERVICIOS.map((s) => (
              <option key={s} value={s}>{LABEL_SERVICIO[s]}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Descripción</label>
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
            placeholder="Ej: Desarrollo de landing page con pasarela de pago"
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Moneda + Monto propuesto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Moneda</label>
            <select
              value={form.moneda}
              onChange={(e) => set({ moneda: e.target.value as "PEN" | "USD" })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <option value="PEN">S/ Soles (PEN)</option>
              <option value="USD">$ Dólares (USD)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Monto propuesto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto_propuesto}
              onChange={(e) => set({ monto_propuesto: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Tipo de cambio (solo si USD) */}
        {form.moneda === "USD" && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo de cambio (USD → PEN)</label>
            <input
              type="number"
              min="1"
              step="0.001"
              value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              placeholder="3.750"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        )}

        {/* Estado */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Estado</label>
          <select
            value={form.estado}
            onChange={(e) => set({ estado: e.target.value as EstadoPropuesta })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{LABEL_ESTADO[e]}</option>
            ))}
          </select>
        </div>

        {/* Fecha propuesta */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Fecha de propuesta</label>
          <input
            type="date"
            value={form.fecha_propuesta}
            onChange={(e) => set({ fecha_propuesta: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Notas</label>
          <textarea
            rows={2}
            value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
            placeholder="Detalles adicionales de la propuesta..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCerrar}
            className="flex-1 px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={cargando || !form.descripcion || !form.monto_propuesto}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition"
          >
            {cargando ? "Guardando..." : "Registrar propuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
