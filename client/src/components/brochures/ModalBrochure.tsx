/** client/src/components/brochures/ModalBrochure.tsx */

import { CANALES } from "./ResumenCanales";

export interface FormBrochure {
  prospecto_id: string;
  canal:        string;
  fecha_envio:  string;
  notas:        string;
}

interface Props {
  form: FormBrochure;
  prospectos: any[];
  cargando: boolean;
  error?: string | null;
  onFormChange: (form: FormBrochure) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function ModalBrochure({
  form, prospectos, cargando, error, onFormChange, onGuardar, onCerrar,
}: Props) {
  const set = (campo: Partial<FormBrochure>) => onFormChange({ ...form, ...campo });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-800">Registrar envío de brochure</h2>

        {/* Prospecto */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Prospecto</label>
          <select
            value={form.prospecto_id}
            onChange={(e) => set({ prospecto_id: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">Selecciona un prospecto</option>
            {prospectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.empresa} — {p.nombre_contacto || p.telefono}
              </option>
            ))}
          </select>
        </div>

        {/* Canal */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Canal de envío</label>
          <select
            value={form.canal}
            onChange={(e) => set({ canal: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            {CANALES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        {/* Fecha de envío */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Fecha de envío</label>
          <input
            type="date"
            value={form.fecha_envio}
            onChange={(e) => set({ fecha_envio: e.target.value })}
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
            placeholder="Ej: Enviado con propuesta de rediseño..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

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
            disabled={cargando || !form.prospecto_id}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition"
          >
            {cargando ? "Guardando..." : "Registrar envío"}
          </button>
        </div>
      </div>
    </div>
  );
}