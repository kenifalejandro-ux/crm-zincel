/**client/src/components/llamadas/LlamadaForm.tsx */

import { useState } from "react";
import { Modal }  from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearLlamada } from "../../services/llamadas.api";
import { fechaHoy } from "../../utils/date";

const CANALES    = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];
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

const MOTIVOS_NO_INTERES = [
  { value: "precio",              label: "💰 Precio muy alto" },
  { value: "sin_presupuesto",     label: "📅 Sin presupuesto ahora" },
  { value: "ya_tiene_proveedor",  label: "🔒 Ya tiene proveedor/servicio" },
  { value: "no_necesita",         label: "🚫 No necesita el servicio" },
  { value: "no_decide",           label: "👤 No es quien decide" },
  { value: "mala_experiencia",    label: "😞 Mala experiencia previa" },
  { value: "otro",                label: "📝 Otro motivo" },
];

const PIDE_MOTIVO = ["no_interesado", "ya_tiene_proveedor"];

const getNowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};
const getToday = () => fechaHoy();

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

interface LlamadaFormProps {
  abierto:     boolean;
  onCerrar:    () => void;
  prospectoId: string;
  onGuardado?: () => void;
}

export function LlamadaForm({ abierto, onCerrar, prospectoId, onGuardado }: LlamadaFormProps) {
  const [form, setForm] = useState({
    fecha:             getToday(),
    hora_inicio:       getNowTime(),
    hora_fin:          "",
    canal:             "llamada",
    contestada:        false,
    resultado:         "",
    motivo_no_interes: "",
    notas:             "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleGuardar() {
    setLoading(true);
    setError(null);
    try {
      const fechaISO = `${form.fecha}T${form.hora_inicio}:00.000Z`;
      await crearLlamada({
        prospecto_id:      prospectoId,
        fecha:             fechaISO,
        hora_fin:          form.hora_fin          || undefined,
        canal:             form.canal,
        contestada:        form.contestada,
        resultado:         form.resultado         || undefined,
        motivo_no_interes: PIDE_MOTIVO.includes(form.resultado) ? (form.motivo_no_interes || undefined) : undefined,
        notas:             form.notas             || undefined,
      });
      onGuardado?.();
      onCerrar();
      setForm({ fecha: getToday(), hora_inicio: getNowTime(), hora_fin: "", canal: "llamada", contestada: false, resultado: "", motivo_no_interes: "", notas: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar llamada">
      <div className="space-y-4">

        {/* Fecha + Canal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className={cls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Canal</label>
            <select value={form.canal} onChange={e => set("canal", e.target.value)} className={cls}>
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Hora inicio + Hora fin */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Hora inicio</label>
            <input type="time" value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)} className={cls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Hora fin <span className="text-gray-400">(opcional)</span></label>
            <input type="time" value={form.hora_fin} onChange={e => set("hora_fin", e.target.value)} className={cls} />
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Resultado</label>
          <select value={form.resultado} onChange={e => { set("resultado", e.target.value); set("motivo_no_interes", ""); }} className={cls}>
            <option value="">Sin resultado</option>
            {RESULTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Motivo de pérdida — solo si el resultado lo requiere */}
        {PIDE_MOTIVO.includes(form.resultado) && (
          <div className="space-y-1 bg-red-50 border border-red-100 rounded-lg p-3">
            <label className="text-xs font-medium text-red-600">¿Por qué no está interesado? <span className="text-red-400">(ayuda a mejorar tu pitch)</span></label>
            <select value={form.motivo_no_interes} onChange={e => set("motivo_no_interes", e.target.value)} className={cls}>
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS_NO_INTERES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        )}

        {/* Contestada */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.contestada}
            onChange={e => set("contestada", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-brand/50" />
          <span className="text-xs text-gray-700">¿Fue contestada?</span>
        </label>

        {/* Notas */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Notas</label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Observaciones de la llamada..."
            className={`${cls} resize-none`} />
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
