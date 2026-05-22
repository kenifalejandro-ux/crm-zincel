/**client/src/components/reuniones/ReunionForm.tsx */

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { crearReunion } from "../../services/reuniones.api";
import type { ModalidadReunion } from "../../types/reunion.types";

const MODALIDADES: { value: ModalidadReunion; label: string }[] = [
  { value: "google_meet",    label: "Google Meet" },
  { value: "zoom",           label: "Zoom" },
  { value: "teams",          label: "Microsoft Teams" },
  { value: "presencial",     label: "Presencial" },
  { value: "whatsapp_video", label: "WhatsApp Video" },
];

interface ReunionFormProps {
  abierto:     boolean;
  onCerrar:    () => void;
  prospectoId: string;
  onGuardado?: () => void;
}

export function ReunionForm({ abierto, onCerrar, prospectoId, onGuardado }: ReunionFormProps) {
  const [form, setForm] = useState({
    titulo: "", fecha_hora: "", modalidad: "google_meet" as ModalidadReunion,
    enlace: "", notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleGuardar() {
    if (!form.titulo || !form.fecha_hora) return;
    setLoading(true);
    setError(null);
    try {
      await crearReunion({
        prospecto_id: prospectoId,
        titulo:       form.titulo,
        fecha_hora:   new Date(form.fecha_hora).toISOString(),
        modalidad:    form.modalidad,
        enlace:       form.enlace || undefined,
        notas:        form.notas || undefined,
      });
      onGuardado?.();
      onCerrar();
      setForm({ titulo: "", fecha_hora: "", modalidad: "google_meet", enlace: "", notas: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva reunión">
      <div className="space-y-4">
        <Input label="Título" placeholder="Ej: Primera reunión de presentación"
          value={form.titulo} onChange={e => set("titulo", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha y hora" type="datetime-local"
            value={form.fecha_hora} onChange={e => set("fecha_hora", e.target.value)} />
          <div className="space-y-1">
            <label className="text-xs font-medium gray-100">Modalidad</label>
            <select value={form.modalidad} onChange={e => set("modalidad", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50">
              {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <Input label="Enlace (opcional)" type="url" placeholder="https://meet.google.com/..."
          value={form.enlace} onChange={e => set("enlace", e.target.value)} />

        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Notas</label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
            placeholder="Temas a tratar, preparación necesaria..." />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading}
            disabled={!form.titulo || !form.fecha_hora} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}