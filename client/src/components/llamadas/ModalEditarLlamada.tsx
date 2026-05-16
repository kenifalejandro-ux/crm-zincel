/** client/src/components/llamadas/ModalEditarLlamada.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";

const CANALES   = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];
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

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

export interface FormEditarLlamada {
  canal:             string;
  contestada:        boolean;
  duracion_minutos:  number;
  resultado:         string;
  notas:             string;
}

function llamadaToForm(l: any): FormEditarLlamada {
  return {
    canal:            l.canal ?? "llamada",
    contestada:       l.contestada ?? false,
    duracion_minutos: l.duracion_minutos ?? 0,
    resultado:        l.resultado ?? "",
    notas:            l.notas ?? "",
  };
}

interface Props {
  llamada:   any;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditarLlamada) => void;
  onCerrar:  () => void;
}

export function ModalEditarLlamada({ llamada, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditarLlamada>(() => llamadaToForm(llamada));
  const set = (campo: Partial<FormEditarLlamada>) => setForm((f) => ({ ...f, ...campo }));

  const nombre = llamada.empresa
    ? `${llamada.empresa}${llamada.nombre_contacto ? ` — ${llamada.nombre_contacto}` : ""}`
    : "Llamada";

  return (
    <ModalEditar
      nombre={nombre}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
    >
      <div className="space-y-3">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Canal</label>
            <select value={form.canal} onChange={(e) => set({ canal: e.target.value })} className={cls}>
              {CANALES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Duración (min)</label>
            <input type="number" min={0} value={form.duracion_minutos}
              onChange={(e) => set({ duracion_minutos: parseInt(e.target.value) || 0 })}
              className={cls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Resultado</label>
          <select value={form.resultado} onChange={(e) => set({ resultado: e.target.value })} className={cls}>
            <option value="">Sin resultado</option>
            {RESULTADOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="contestada-edit" checked={form.contestada}
            onChange={(e) => set({ contestada: e.target.checked })}
            className="rounded accent-blue-600" />
          <label htmlFor="contestada-edit" className="text-xs text-gray-700">¿Fue contestada?</label>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea value={form.notas} onChange={(e) => set({ notas: e.target.value })} rows={3}
            className={`${cls} resize-none`} placeholder="Observaciones de la llamada..." />
        </div>

      </div>
    </ModalEditar>
  );
}
