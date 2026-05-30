/** client/src/components/llamadas/ModalEditarLlamada.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";

const CANALES = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];

const RESULTADOS = [
  { value: "interesado",          label: "Interesado" },
  { value: "solicita_informacion", label: "Solicita información" },
  { value: "no_interesado",       label: "No interesado" },
  { value: "no_contesta",         label: "No contesta" },
  { value: "volver_a_llamar",     label: "Volver a llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
  { value: "perdida",             label: "Venta perdida" },
];

const MOTIVOS_DESCARTE = [
  { value: "precio_alto",      label: "Precio alto" },
  { value: "sin_presupuesto",  label: "Sin presupuesto" },
  { value: "no_le_interesa",   label: "No le interesa el servicio" },
  { value: "tiene_web",        label: "Empresa con página web" },
  { value: "no_toma_decision", label: "No es quien decide" },
  { value: "otro",             label: "Otro" },
];

const ACCIONES_ACORDADAS = [
  { value: "enviar_brochure", label: "Enviar brochure" },
  { value: "agendar_reunion", label: "Agendar reunión" },
  { value: "cotizar",         label: "Enviar cotización" },
  { value: "volver_llamar",   label: "Volver a llamar" },
  { value: "ninguna",         label: "Sin acción específica" },
];

const PIDE_MOTIVO = ["no_interesado", "ya_tiene_proveedor"];
const PIDE_ACCION = ["interesado", "solicita_informacion", "volver_a_llamar"];

const cls = "w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
const lbl = "text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1 block";

export interface FormEditarLlamada {
  fecha:             string;
  canal:             string;
  contestada:        boolean;
  hora_inicio:       string;
  hora_fin:          string;
  resultado:         string;
  motivo_no_interes: string;
  accion_acordada:   string;
  notas:             string;
}

function llamadaToForm(l: any): FormEditarLlamada {
  const t = l.fecha ? new Date(l.fecha) : new Date();
  const fechaLocal = l.fecha
    ? new Date(l.fecha).toLocaleDateString("sv-SE")
    : new Date().toLocaleDateString("sv-SE");
  return {
    fecha:             fechaLocal,
    canal:             l.canal             ?? "llamada",
    contestada:        l.contestada        ?? false,
    hora_inicio:       `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,
    hora_fin:          l.hora_fin          ?? "",
    resultado:         l.resultado         ?? "",
    motivo_no_interes: l.motivo_no_interes ?? "",
    accion_acordada:   l.accion_acordada   ?? "",
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
      variant="dark"
    >
      <div className="space-y-3">

        <div>
          <label className={lbl}>Fecha</label>
          <input type="date" value={form.fecha}
            onChange={(e) => set({ fecha: e.target.value })}
            className={cls} />
        </div>

        <div>
          <label className={lbl}>Canal</label>
          <select value={form.canal} onChange={(e) => set({ canal: e.target.value })} className={cls}>
            {CANALES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        {form.canal === "llamada" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Hora inicio</label>
              <input type="time" value={form.hora_inicio}
                onChange={(e) => set({ hora_inicio: e.target.value })}
                className={cls} />
            </div>
            <div>
              <label className={lbl}>Hora fin <span className="normal-case">(opc.)</span></label>
              <input type="time" value={form.hora_fin}
                onChange={(e) => set({ hora_fin: e.target.value })}
                className={cls} />
            </div>
          </div>
        )}

        <div>
          <label className={lbl}>Estado del lead</label>
          <select value={form.resultado} onChange={(e) => set({ resultado: e.target.value, motivo_no_interes: "" })} className={cls}>
            <option value="">Sin resultado</option>
            {RESULTADOS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {PIDE_MOTIVO.includes(form.resultado) && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
            <label className="text-[10px] text-red-400 font-semibold uppercase tracking-widest mb-1 block">Motivo de descarte</label>
            <select value={form.motivo_no_interes} onChange={(e) => set({ motivo_no_interes: e.target.value })} className={cls}>
              <option value="">Sin especificar</option>
              {MOTIVOS_DESCARTE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        )}

        {form.contestada && PIDE_ACCION.includes(form.resultado) && (
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3">
            <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1 block">Acción acordada</label>
            <select value={form.accion_acordada} onChange={(e) => set({ accion_acordada: e.target.value })} className={cls}>
              <option value="">Sin definir</option>
              {ACCIONES_ACORDADAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="checkbox" id="contestada-edit" checked={form.contestada}
            onChange={(e) => set({ contestada: e.target.checked })}
            className="rounded accent-brand" />
          <label htmlFor="contestada-edit" className="text-xs text-zinc-300">¿Fue contestada?</label>
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea value={form.notas} onChange={(e) => set({ notas: e.target.value })} rows={3}
            className={`${cls} resize-none`} placeholder="Observaciones de la llamada..." />
        </div>

      </div>
    </ModalEditar>
  );
}
