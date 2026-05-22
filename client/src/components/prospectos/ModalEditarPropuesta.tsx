/** client/src/components/propuestas/ModalEditarPropuesta.tsx */

import type { Propuesta, FormPropuesta, EstadoPropuesta, ServicioPropuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO, MOTIVOS_CIERRE_PERDIDO } from "../../types/propuesta.types";

const SERVICIOS = Object.keys(LABEL_SERVICIO) as ServicioPropuesta[];
const ESTADOS   = Object.keys(LABEL_ESTADO)   as EstadoPropuesta[];

interface Props {
  propuesta:    Propuesta;
  form:         FormPropuesta;
  cargando:     boolean;
  onFormChange: (form: FormPropuesta) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalEditarPropuesta({ propuesta, form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormPropuesta>) => onFormChange({ ...form, ...campo });

  const esCerrada     = form.estado === "cerrada_ganada" || form.estado === "cerrada_perdida";
  const esFinalizada  = esCerrada || form.estado === "vencida";
  const esNegociacion = form.estado === "en_negociacion";
  const esPerdida     = form.estado === "cerrada_perdida" || form.estado === "vencida";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-zinc-800">Editar propuesta</h2>

        {/* Alerta auto-ingreso */}
        {form.estado === "cerrada_ganada" && propuesta.estado !== "cerrada_ganada" && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
            <span className="text-lg">✅</span>
            <p className="text-xs text-green-700">
              Al guardar se creará automáticamente un ingreso en Finanzas con el monto cerrado.
            </p>
          </div>
        )}

        {/* Servicio */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de servicio</label>
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
          <label className="text-xs font-medium text-gray-500 mb-1 block">Descripción</label>
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Moneda + Monto propuesto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Moneda</label>
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
            <label className="text-xs font-medium text-gray-500 mb-1 block">Monto propuesto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto_propuesto}
              onChange={(e) => set({ monto_propuesto: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        </div>

        {/* Monto cerrado (solo si estado cerrado) */}
        {esCerrada && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Monto cerrado
              <span className="ml-1 text-zinc-400 font-normal">(lo que realmente se cobró)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.monto_cerrado}
              onChange={(e) => set({ monto_cerrado: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        )}

        {/* Tipo de cambio */}
        {form.moneda === "USD" && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de cambio</label>
            <input
              type="number"
              min="1"
              step="0.001"
              value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
        )}

        {/* Estado */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
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

        {/* Fechas — una por cada etapa relevante */}
        <div className="space-y-3 border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Fechas del proceso</p>

          {/* Enviada — siempre visible */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              📤 Enviada — fecha de propuesta
            </label>
            <input
              type="date"
              value={form.fecha_propuesta}
              onChange={(e) => set({ fecha_propuesta: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>

          {/* Negociación — cuando el estado es en_negociacion o más avanzado */}
          {(esNegociacion || esFinalizada) && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                ⚖️ En negociación — fecha de inicio
              </label>
              <input
                type="date"
                value={form.fecha_negociacion}
                onChange={(e) => set({ fecha_negociacion: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
          )}

          {/* Cierre — solo si está cerrada */}
          {esCerrada && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {form.estado === "cerrada_ganada" ? "✅ Cerrada ganada" : "❌ Cerrada perdida"} — fecha de cierre
              </label>
              <input
                type="date"
                value={form.fecha_cierre}
                onChange={(e) => set({ fecha_cierre: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
          )}
        </div>

        {/* Motivo cierre perdido — solo si cerrada_perdida o vencida */}
        {esPerdida && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
            <label className="text-xs font-semibold text-red-700 block">
              ¿Por qué se perdió esta venta? <span className="font-normal text-red-400">(ayuda a mejorar)</span>
            </label>
            <select
              value={form.motivo_cierre_perdido}
              onChange={(e) => set({ motivo_cierre_perdido: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
            >
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS_CIERRE_PERDIDO.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea
            rows={2}
            value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
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
            disabled={cargando}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition"
          >
            {cargando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
