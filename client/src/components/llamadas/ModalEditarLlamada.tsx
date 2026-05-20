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

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

export interface FormEditarLlamada {
  canal:             string;
  contestada:        boolean;
  hora_inicio:       string;
  hora_fin:          string;
  resultado:         string;
  motivo_no_interes: string;
  notas:             string;
}

function llamadaToForm(l: any): FormEditarLlamada {
  const t = l.fecha ? new Date(l.fecha) : new Date();
  return {
    canal:             l.canal             ?? "llamada",
    contestada:        l.contestada        ?? false,
    hora_inicio:       `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,
    hora_fin:          l.hora_fin          ?? "",
    resultado:         l.resultado         ?? "",
    motivo_no_interes: l.motivo_no_interes ?? "",
    notas:             l.notas             ?? "",
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

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Canal</label>
          <select value={form.canal} onChange={(e) => set({ canal: e.target.value })} className={cls}>
            {CANALES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Hora inicio</label>
            <input type="time" value={form.hora_inicio}
              onChange={(e) => set({ hora_inicio: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Hora fin <span className="text-gray-400">(opc.)</span></label>
            <input type="time" value={form.hora_fin}
              onChange={(e) => set({ hora_fin: e.target.value })}
              className={cls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Resultado</label>
          <select value={form.resultado} onChange={(e) => set({ resultado: e.target.value, motivo_no_interes: "" })} className={cls}>
            <option value="">Sin resultado</option>
            {RESULTADOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {PIDE_MOTIVO.includes(form.resultado) && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <label className="text-xs font-medium text-red-600 mb-1 block">¿Por qué no está interesado?</label>
            <select value={form.motivo_no_interes} onChange={(e) => set({ motivo_no_interes: e.target.value })} className={cls}>
              <option value="">Seleccionar motivo...</option>
              {MOTIVOS_NO_INTERES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        )}

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
