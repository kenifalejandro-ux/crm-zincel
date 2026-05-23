/** client/src/components/reuniones/ModalReunion.tsx */

const MODALIDADES = ["zoom", "google_meet", "presencial", "teams", "whatsapp_video"];

export interface FormReunion {
  prospecto_id: string;
  titulo: string;
  fecha_hora: string;
  modalidad: string;
  enlace: string;
  estado: string;
  notas: string;
}

interface Props {
  form: FormReunion;
  prospectos: any[];
  cargando: boolean;
  onFormChange: (form: FormReunion) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function ModalReunion({
  form, prospectos, cargando, onFormChange, onGuardar, onCerrar,
}: Props) {
  const set = (campo: Partial<FormReunion>) => onFormChange({ ...form, ...campo });
  const disabled = cargando || !form.prospecto_id || !form.titulo || !form.fecha_hora;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-800">Nueva reunión</h2>

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

        {/* Título */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => set({ titulo: e.target.value })}
            placeholder="Ej: Primera reunión de presentación"
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Fecha + Modalidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Fecha y hora</label>
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={(e) => set({ fecha_hora: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Modalidad</label>
            <select
              value={form.modalidad}
              onChange={(e) => set({ modalidad: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              {MODALIDADES.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enlace */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Enlace (opcional)</label>
          <input
            type="url"
            value={form.enlace}
            onChange={(e) => set({ enlace: e.target.value })}
            placeholder="https://meet.google.com/..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
            rows={2}
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
            disabled={disabled}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-60 text-white rounded-lg transition"
          >
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}