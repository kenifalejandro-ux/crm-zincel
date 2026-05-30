/** client/src/components/reuniones/ModalEditarReunion.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import type { Reunion } from "../../types/reunion.types";

const MODALIDADES = ["zoom", "google_meet", "presencial", "teams", "whatsapp_video", "llamada"];
const ESTADOS     = ["programada", "realizada", "cancelada", "reprogramada", "en_proceso"];

const cls = "w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
const lbl = "text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1 block";

export interface FormEditarReunion {
  titulo:     string;
  fecha_hora: string;
  modalidad:  string;
  enlace:     string;
  estado:     string;
  notas:      string;
}

function reunionToForm(r: Reunion): FormEditarReunion {
  return {
    titulo:     r.titulo,
    fecha_hora: r.fecha_hora.slice(0, 16),
    modalidad:  r.modalidad,
    enlace:     r.enlace ?? "",
    estado:     r.estado,
    notas:      r.notas ?? "",
  };
}

interface Props {
  reunion:   Reunion;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditarReunion) => void;
  onCerrar:  () => void;
}

export function ModalEditarReunion({ reunion, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditarReunion>(() => reunionToForm(reunion));
  const set = (campo: Partial<FormEditarReunion>) => setForm((f) => ({ ...f, ...campo }));

  return (
    <ModalEditar
      nombre={reunion.titulo}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
      variant="dark"
    >
      <div className="space-y-3">

        {reunion.empresa && (
          <p className="text-xs text-zinc-400">
            Prospecto: <span className="font-medium text-zinc-300">{reunion.empresa}</span>
            {reunion.nombre_contacto && ` — ${reunion.nombre_contacto}`}
          </p>
        )}

        <div>
          <label className={lbl}>Título</label>
          <input type="text" value={form.titulo}
            onChange={(e) => set({ titulo: e.target.value })}
            className={cls} placeholder="Ej: Presentación de servicios" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Fecha y hora</label>
            <input type="datetime-local" value={form.fecha_hora}
              onChange={(e) => set({ fecha_hora: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className={lbl}>Modalidad</label>
            <select value={form.modalidad} onChange={(e) => set({ modalidad: e.target.value })} className={cls}>
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Estado</label>
          <select value={form.estado} onChange={(e) => set({ estado: e.target.value })} className={cls}>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Enlace <span className="normal-case">(opcional)</span></label>
          <input type="url" value={form.enlace}
            onChange={(e) => set({ enlace: e.target.value })}
            className={cls} placeholder="https://meet.google.com/..." />
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea value={form.notas} onChange={(e) => set({ notas: e.target.value })} rows={2}
            className={`${cls} resize-none`} placeholder="Observaciones..." />
        </div>

      </div>
    </ModalEditar>
  );
}
