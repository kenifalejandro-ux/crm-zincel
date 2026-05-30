/**client/src/components/reuniones/ReunionForm.tsx */

import { useState } from "react";
import type { ReactNode } from "react";
import { AlignLeft, CalendarClock, Video, Link, StickyNote, AlertCircle, Users } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearReunion } from "../../services/reuniones.api";
import type { ModalidadReunion } from "../../types/reunion.types";

const MODALIDADES: { value: ModalidadReunion; label: string }[] = [
  { value: "google_meet",    label: "Google Meet" },
  { value: "zoom",           label: "Zoom" },
  { value: "teams",          label: "Microsoft Teams" },
  { value: "presencial",     label: "Presencial" },
  { value: "whatsapp_video", label: "WhatsApp Video" },
  { value: "llamada",        label: "Llamada" },
];

const sel = "w-full px-3 py-2.5 text-xs bg-zinc-800 border border-yellow-300/30 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-all";

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2.5 border-b border-zinc-600 pb-1.5 focus-within:border-brand transition-colors group">
        <span className="text-yellow-500 shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}

const fi = "flex-1 text-xs text-zinc-100 bg-transparent outline-none placeholder:text-zinc-500 min-w-0 [color-scheme:dark]";

interface ReunionFormProps {
  abierto:      boolean;
  onCerrar:     () => void;
  onGuardado?:  () => void;
  prospectoId?: string;  // desde ProspectoDetalle
  prospectos?:  any[];   // desde ReunionesPage — muestra selector
}

export function ReunionForm({ abierto, onCerrar, onGuardado, prospectoId, prospectos }: ReunionFormProps) {
  const [prospectoSel, setProspectoSel] = useState("");
  const [form, setForm] = useState({
    titulo: "", fecha_hora: "", modalidad: "google_meet" as ModalidadReunion,
    enlace: "", notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const idEfectivo = prospectoId ?? prospectoSel;

  function reset() {
    setProspectoSel("");
    setForm({ titulo: "", fecha_hora: "", modalidad: "google_meet", enlace: "", notas: "" });
    setError(null);
  }

  async function handleGuardar() {
    if (!idEfectivo || !form.titulo || !form.fecha_hora) return;
    setLoading(true);
    setError(null);
    try {
      await crearReunion({
        prospecto_id: idEfectivo,
        titulo:       form.titulo,
        fecha_hora:   new Date(form.fecha_hora).toISOString(),
        modalidad:    form.modalidad,
        enlace:       form.enlace || undefined,
        notas:        form.notas || undefined,
      });
      onGuardado?.();
      reset();
      onCerrar();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva reunión" variant="dark">
      <div className="space-y-4">

        {/* Selector de prospecto — solo desde ReunionesPage */}
        {prospectos && (
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Users size={11} className="text-yellow-500"/>Prospecto *
            </label>
            <select value={prospectoSel} onChange={e => setProspectoSel(e.target.value)} className={sel}>
              <option value="">Selecciona un prospecto</option>
              {prospectos.map(p => (
                <option key={p.id} value={p.id}>{p.empresa} — {p.nombre_contacto || p.telefono}</option>
              ))}
            </select>
          </div>
        )}

        {/* Título + Fecha + Modalidad */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-4">
          <Field icon={<AlignLeft size={14}/>} label="Título *">
            <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
              placeholder="Ej: Primera reunión de presentación" className={fi} />
          </Field>

          <div className="grid grid-cols-2 gap-x-6">
            <Field icon={<CalendarClock size={14}/>} label="Fecha y hora *">
              <input type="datetime-local" value={form.fecha_hora} onChange={e => set("fecha_hora", e.target.value)} className={fi} />
            </Field>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest block mb-1.5">Modalidad</label>
              <select value={form.modalidad} onChange={e => set("modalidad", e.target.value)} className={sel}>
                {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <Field icon={<Link size={14}/>} label="Enlace (opcional)">
            <input type="url" value={form.enlace} onChange={e => set("enlace", e.target.value)}
              placeholder="https://meet.google.com/..." className={fi} />
          </Field>
        </div>

        {/* Notas */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
          <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <StickyNote size={11} className="text-yellow-500"/>Notas
          </label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Temas a tratar, preparación necesaria..."
            className="w-full text-xs bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/25 resize-none" />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl">
            <AlertCircle size={14} className="text-red-400 shrink-0"/>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading}
            disabled={!idEfectivo || !form.titulo || !form.fecha_hora} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
