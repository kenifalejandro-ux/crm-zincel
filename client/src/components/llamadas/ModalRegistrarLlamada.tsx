/** client/src/components/llamadas/ModalRegistrarLlamada.tsx */

const CANALES = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];

const RESULTADOS = [
  { value: "interesado",         label: "Interesado" },
  { value: "no_interesado",      label: "No interesado" },
  { value: "no_contesta",        label: "No contesta" },
  { value: "volver_a_llamar",    label: "Volver a llamar" },
  { value: "buzon_de_voz",       label: "Buzón de voz" },
  { value: "fuera_de_servicio",  label: "Fuera de servicio" },
  { value: "numero_equivocado",  label: "Número equivocado" },
  { value: "ya_tiene_proveedor", label: "Ya tiene proveedor" },
];

export interface FormLlamada {
  prospecto_id: string;
  canal: string;
  contestada: boolean;
  duracion_minutos: number;
  resultado: string;
  notas: string;
}

interface Props {
  form: FormLlamada;
  prospectos: any[];
  cargando: boolean;
  onFormChange: (form: FormLlamada) => void;
  onGuardar: () => void;
  onCerrar: () => void;
}

export function ModalRegistrarLlamada({
  form,
  prospectos,
  cargando,
  onFormChange,
  onGuardar,
  onCerrar,
}: Props) {
  const set = (campo: Partial<FormLlamada>) => onFormChange({ ...form, ...campo });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-800">Registrar llamada</h2>

        {/* Prospecto */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Prospecto</label>
          <select
            value={form.prospecto_id}
            onChange={(e) => set({ prospecto_id: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona un prospecto</option>
            {prospectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.empresa} — {p.nombre_contacto || p.telefono}
              </option>
            ))}
          </select>
        </div>

        {/* Canal + Duración */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Canal</label>
            <select
              value={form.canal}
              onChange={(e) => set({ canal: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CANALES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Duración (min)</label>
            <input
              type="number"
              min={0}
              value={form.duracion_minutos}
              onChange={(e) => set({ duracion_minutos: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Resultado */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Resultado</label>
          <select
            value={form.resultado}
            onChange={(e) => set({ resultado: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin resultado</option>
            {RESULTADOS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Contestada */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="contestada"
            checked={form.contestada}
            onChange={(e) => set({ contestada: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="contestada" className="text-xs text-gray-700">
            ¿Fue contestada?
          </label>
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Observaciones de la llamada..."
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
            disabled={cargando || !form.prospecto_id}
            className="flex-1 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
          >
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}