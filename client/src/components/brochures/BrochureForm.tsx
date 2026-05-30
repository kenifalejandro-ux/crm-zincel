/**client/src/components/brochures/BrochureForm.tsx */

import { useState } from "react";
import { Calendar, StickyNote, AlertCircle, Mail, MessageCircle, Globe, Camera, Share2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearBrochure } from "../../services/brochures.api";
import { fechaHoy } from "../../utils/date";

const CANALES = [
  { value: "correo",    label: "Correo electrónico", icon: <Mail size={13}/> },
  { value: "whatsapp",  label: "WhatsApp",            icon: <MessageCircle size={13}/> },
  { value: "linkedin",  label: "LinkedIn",  icon: <Globe size={13}/> },
  { value: "instagram", label: "Instagram", icon: <Camera size={13}/> },
  { value: "facebook",  label: "Facebook",  icon: <Share2 size={13}/> },
];

const sel = "w-full px-3 py-2.5 text-xs bg-zinc-800 border border-yellow-300/30 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-all";

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2.5 border-b border-zinc-600 pb-1.5 focus-within:border-brand transition-colors">
        <span className="text-yellow-500 shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}

const fi = "flex-1 text-xs text-zinc-100 bg-transparent outline-none placeholder:text-zinc-500 min-w-0 [color-scheme:dark]";

interface BrochureFormProps {
  abierto:      boolean;
  onCerrar:     () => void;
  onGuardado?:  () => void;
  prospectoId?: string;  // desde ProspectoDetalle
  prospectos?:  any[];   // desde BrochuresPage — muestra selector
}

export function BrochureForm({ abierto, onCerrar, onGuardado, prospectoId, prospectos }: BrochureFormProps) {
  const [prospectoSel, setProspectoSel] = useState("");
  const [canal,        setCanal]        = useState("correo");
  const [fechaEnvio,   setFechaEnvio]   = useState(fechaHoy());
  const [notas,        setNotas]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const idEfectivo = prospectoId ?? prospectoSel;

  function reset() {
    setProspectoSel("");
    setCanal("correo");
    setFechaEnvio(fechaHoy());
    setNotas("");
    setError(null);
  }

  async function handleGuardar() {
    if (!idEfectivo) return;
    setLoading(true);
    setError(null);
    try {
      await crearBrochure({
        prospecto_id: idEfectivo,
        canal,
        fecha_envio: fechaEnvio || undefined,
        notas:       notas || undefined,
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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar envío de brochure" variant="dark">
      <div className="space-y-4">

        {/* Selector de prospecto — solo desde BrochuresPage */}
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

        {/* Fecha + Canal */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-4">
          <Field icon={<Calendar size={14}/>} label="Fecha de envío">
            <input type="date" value={fechaEnvio} onChange={e => setFechaEnvio(e.target.value)} className={fi} />
          </Field>

          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest block mb-2">Canal de envío</label>
            <div className="grid grid-cols-2 gap-2">
              {CANALES.map(c => (
                <button key={c.value} onClick={() => setCanal(c.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl border transition text-left ${
                    canal === c.value
                      ? "border-brand bg-brand/10 text-brand font-semibold"
                      : "border-zinc-600 hover:border-zinc-400 text-zinc-400 hover:text-zinc-200"
                  }`}>
                  <span className={canal === c.value ? "text-brand" : "text-yellow-500"}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
          <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <StickyNote size={11} className="text-yellow-500"/>Notas
          </label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
            placeholder="Ej: Enviado con propuesta de rediseño..."
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
            disabled={!idEfectivo} onClick={handleGuardar}>
            Registrar envío
          </Button>
        </div>
      </div>
    </Modal>
  );
}
