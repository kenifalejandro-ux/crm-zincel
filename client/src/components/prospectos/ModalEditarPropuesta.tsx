/** client/src/components/propuestas/ModalEditarPropuesta.tsx */

import { Modal }  from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Propuesta, FormPropuesta, EstadoPropuesta, ServicioPropuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO, MOTIVOS_CIERRE_PERDIDO } from "../../types/propuesta.types";

const SERVICIOS = Object.keys(LABEL_SERVICIO) as ServicioPropuesta[];
const ESTADOS   = Object.keys(LABEL_ESTADO)   as EstadoPropuesta[];

const inp = "w-full px-3 py-2 text-xs bg-zinc-900/50 border border-zinc-600 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/50 [color-scheme:dark]";
const sel = "w-full px-3 py-2 text-xs bg-zinc-900/50 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50";
const lbl = "text-xs font-medium text-zinc-400 mb-1 block";

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
    <Modal abierto onCerrar={onCerrar} titulo="Editar propuesta" variant="dark" size="md">
      <div className="space-y-4">

        {/* Alerta auto-ingreso */}
        {form.estado === "cerrada_ganada" && propuesta.estado !== "cerrada_ganada" && (
          <div className="flex items-start gap-2 bg-green-900/40 border border-green-700/50 rounded-xl p-3">
            <span className="text-lg">✅</span>
            <p className="text-xs text-green-300">
              Al guardar se creará automáticamente un ingreso en Finanzas con el monto cerrado.
            </p>
          </div>
        )}

        {/* Servicio */}
        <div>
          <label className={lbl}>Tipo de servicio</label>
          <select value={form.servicio} onChange={e => set({ servicio: e.target.value as ServicioPropuesta })} className={sel}>
            {SERVICIOS.map(s => <option key={s} value={s}>{LABEL_SERVICIO[s]}</option>)}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className={lbl}>Descripción</label>
          <input type="text" value={form.descripcion}
            onChange={e => set({ descripcion: e.target.value })}
            className={inp} />
        </div>

        {/* Moneda + Monto propuesto */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Moneda</label>
            <select value={form.moneda} onChange={e => set({ moneda: e.target.value as "PEN" | "USD" })} className={sel}>
              <option value="PEN">S/ Soles (PEN)</option>
              <option value="USD">$ Dólares (USD)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Monto propuesto</label>
            <input type="number" min="0" step="0.01" value={form.monto_propuesto}
              onChange={e => set({ monto_propuesto: e.target.value })}
              className={inp} />
          </div>
        </div>

        {/* Monto cerrado */}
        {esCerrada && (
          <div>
            <label className={lbl}>
              Monto cerrado <span className="font-normal text-zinc-500">(lo que realmente se cobró)</span>
            </label>
            <input type="number" min="0" step="0.01" value={form.monto_cerrado}
              onChange={e => set({ monto_cerrado: e.target.value })}
              placeholder="0.00" className={inp} />
          </div>
        )}

        {/* Tipo de cambio */}
        {form.moneda === "USD" && (
          <div>
            <label className={lbl}>Tipo de cambio</label>
            <input type="number" min="1" step="0.001" value={form.tipo_cambio}
              onChange={e => set({ tipo_cambio: e.target.value })}
              className={inp} />
          </div>
        )}

        {/* Estado */}
        <div>
          <label className={lbl}>Estado</label>
          <select value={form.estado} onChange={e => set({ estado: e.target.value as EstadoPropuesta })} className={sel}>
            {ESTADOS.map(e => <option key={e} value={e}>{LABEL_ESTADO[e]}</option>)}
          </select>
        </div>

        {/* Fechas */}
        <div className="space-y-3 border border-dashed border-zinc-600 rounded-xl p-3 bg-zinc-900/30">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Fechas del proceso</p>

          <div>
            <label className={lbl}>📤 Enviada — fecha de propuesta</label>
            <input type="date" value={form.fecha_propuesta}
              onChange={e => set({ fecha_propuesta: e.target.value })}
              className={inp} />
          </div>

          {(esNegociacion || esFinalizada) && (
            <div>
              <label className={lbl}>⚖️ En negociación — fecha de inicio</label>
              <input type="date" value={form.fecha_negociacion}
                onChange={e => set({ fecha_negociacion: e.target.value })}
                className={inp} />
            </div>
          )}

          {esCerrada && (
            <div>
              <label className={lbl}>
                {form.estado === "cerrada_ganada" ? "✅ Cerrada ganada" : "❌ Cerrada perdida"} — fecha de cierre
              </label>
              <input type="date" value={form.fecha_cierre}
                onChange={e => set({ fecha_cierre: e.target.value })}
                className={inp} />
            </div>
          )}
        </div>

        {/* Motivo cierre perdido */}
        {esPerdida && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 space-y-2">
            <label className="text-xs font-semibold text-red-400 block">
              ¿Por qué se perdió esta venta? <span className="font-normal text-red-500">(ayuda a mejorar)</span>
            </label>
            <select value={form.motivo_cierre_perdido}
              onChange={e => set({ motivo_cierre_perdido: e.target.value })}
              className={`${sel} border-red-700/50`}>
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS_CIERRE_PERDIDO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className={lbl}>Notas</label>
          <textarea rows={2} value={form.notas}
            onChange={e => set({ notas: e.target.value })}
            className={`${inp} resize-none`} />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1 border-t border-zinc-700">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={cargando} onClick={onGuardar}>Guardar cambios</Button>
        </div>

      </div>
    </Modal>
  );
}
