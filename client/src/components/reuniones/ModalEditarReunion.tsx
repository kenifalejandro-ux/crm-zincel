/** client/src/components/reuniones/ModalEditarReunion.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import type { Reunion } from "../../types/reunion.types";

const MODALIDADES = ["zoom", "google_meet", "presencial", "teams", "whatsapp_video", "llamada"];
const ESTADOS     = ["programada", "realizada", "cancelada", "reprogramada", "en_proceso"];

const cls = "w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
const lbl = "text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1 block";

const HORAS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const selT = "px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hh, mm] = value ? value.split(":") : ["", ""];
  return (
    <div className="flex items-center gap-1.5">
      <select value={hh} onChange={e => onChange(`${e.target.value}:${mm || "00"}`)} className={selT}>
        <option value="">HH</option>
        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-zinc-400 font-bold text-xs">:</span>
      <select value={mm} onChange={e => onChange(`${hh || "00"}:${e.target.value}`)} className={selT}>
        <option value="">MM</option>
        {MINUTOS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      {hh && <span className="text-[11px] text-zinc-400">{parseInt(hh) < 12 ? "a.m." : "p.m."}</span>}
    </div>
  );
}

export interface FormEditarReunion {
  titulo:     string;
  fecha:      string;
  hora_inicio: string;
  hora_fin:   string;
  modalidad:  string;
  enlace:     string;
  estado:     string;
  notas:      string;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function reunionToForm(r: Reunion): FormEditarReunion {
  const d = new Date(r.fecha_hora);
  return {
    titulo:      r.titulo,
    fecha:       `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hora_inicio: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    hora_fin:    r.hora_fin?.slice(0, 5) ?? "",
    modalidad:   r.modalidad,
    enlace:      r.enlace ?? "",
    estado:      r.estado,
    notas:       r.notas ?? "",
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
            <label className={lbl}>Fecha</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className={lbl}>Hora inicio</label>
            <TimePicker value={form.hora_inicio} onChange={v => set({ hora_inicio: v })} />
          </div>
        </div>

        {["realizada","en_proceso"].includes(form.estado) && (
          <div>
            <label className={lbl}>
              Hora fin
              {form.hora_inicio && form.hora_fin && (() => {
                const [hi, mi] = form.hora_inicio.split(":").map(Number);
                const [hf, mf] = form.hora_fin.split(":").map(Number);
                const mins = (hf * 60 + mf) - (hi * 60 + mi);
                if (mins > 0 && mins < 720) return (
                  <span className="ml-2 normal-case text-emerald-400 font-medium">
                    · {mins >= 60 ? `${Math.floor(mins/60)}h${mins%60 > 0 ? ` ${mins%60}m` : ""}` : `${mins}m`}
                  </span>
                );
              })()}
            </label>
            <TimePicker value={form.hora_fin} onChange={v => set({ hora_fin: v })} />
          </div>
        )}

        <div>
          <label className={lbl}>Modalidad</label>
          <select value={form.modalidad} onChange={(e) => set({ modalidad: e.target.value })} className={cls}>
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>Estado</label>
          <select value={form.estado} onChange={(e) => {
            const nuevoEstado = e.target.value;
            if (!["realizada","en_proceso"].includes(nuevoEstado)) {
              set({ estado: nuevoEstado, hora_fin: "" });
            } else {
              set({ estado: nuevoEstado });
            }
          }} className={cls}>
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
