/**client/src/components/llamadas/LlamadaForm.tsx */

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { crearLlamada } from "../../services/llamadas.api";

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

interface LlamadaFormProps {
  abierto:     boolean;
  onCerrar:    () => void;
  prospectoId: string;
  onGuardado?: () => void;
}

export function LlamadaForm({ abierto, onCerrar, prospectoId, onGuardado }: LlamadaFormProps) {
  const [form, setForm] = useState({
    canal: "llamada", contestada: false,
    duracion_minutos: 0, resultado: "", notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleGuardar() {
    setLoading(true);
    setError(null);
    try {
      await crearLlamada({
        prospecto_id:     prospectoId,
        canal:            form.canal,
        contestada:       form.contestada,
        duracion_minutos: form.duracion_minutos,
        resultado:        form.resultado || undefined,
        notas:            form.notas || undefined,
      });
      onGuardado?.();
      onCerrar();
      setForm({ canal: "llamada", contestada: false, duracion_minutos: 0, resultado: "", notas: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    /**modal del button - registrar llamada */
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar llamada">
      <div className="space-y-4 ">
        <div className="grid grid-cols-2 gap-3 ">
          <div className="space-y-1">
            <label className="text-xs font-medium gray-100">Canal</label>
            <select value={form.canal} onChange={e => set("canal", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Duración (min)" type="number" min={0}
            value={form.duracion_minutos}
            onChange={e => set("duracion_minutos", parseInt(e.target.value) || 0)} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Resultado</label>
          <select value={form.resultado} onChange={e => set("resultado", e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sin resultado</option>
            {RESULTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.contestada}
            onChange={e => set("contestada", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-xs text-gray-700">¿Fue contestada?</span>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-medium gray-100">Notas</label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Observaciones de la llamada..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleGuardar}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}