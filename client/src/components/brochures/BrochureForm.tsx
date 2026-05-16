/**client/src/components/brochures/BrochureForm.tsx */

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearBrochure } from "../../services/brochures.api";

const CANALES = [
  { value: "correo",    label: "Correo electrónico" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook",  label: "Facebook" },
];

interface BrochureFormProps {
  abierto:     boolean;
  onCerrar:    () => void;
  prospectoId: string;
  onGuardado?: () => void;
}

export function BrochureForm({ abierto, onCerrar, prospectoId, onGuardado }: BrochureFormProps) {
  const [canal,   setCanal]   = useState("correo");
  const [notas,   setNotas]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleGuardar() {
    setLoading(true);
    setError(null);
    try {
      await crearBrochure({ prospecto_id: prospectoId, canal, notas: notas || undefined });
      onGuardado?.();
      onCerrar();
      setCanal("correo");
      setNotas("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar envío de brochure">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Canal de envío</label>
          <div className="grid grid-cols-2 gap-2">
            {CANALES.map(c => (
              <button key={c.value} onClick={() => setCanal(c.value)}
                className={`px-3 py-2 text-xs rounded-lg border transition text-left ${
                  canal === c.value
                    ? "border-blue-500 bg-blue-50 text-zinc-800 font-medium"
                    : "border-gray-200 hover:border-gray-300 gray-100"
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Notas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
            placeholder="Ej: Enviado con propuesta de rediseño..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleGuardar}>
            Registrar envío
          </Button>
        </div>
      </div>
    </Modal>
  );
}