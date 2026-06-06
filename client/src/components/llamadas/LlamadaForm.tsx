/**client/src/components/llamadas/LlamadaForm.tsx */

import { useState } from "react";
import type { ReactNode } from "react";
import { Calendar, Clock, Activity, Phone, StickyNote, AlertCircle, Users, CheckCircle2, Hash } from "lucide-react";
import { Modal }  from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearLlamada } from "../../services/llamadas.api";
import { fechaHoy, toLocalISOString } from "../../utils/date";

const CANALES    = ["llamada", "whatsapp", "correo", "linkedin", "instagram", "facebook"];
const RESULTADOS = [
  { value: "interesado",          label: "Interesado" },
  { value: "solicita_informacion", label: "Solicita información" },
  { value: "no_interesado",       label: "No interesado" },
  { value: "no_contesta",         label: "No contesta" },
  { value: "volver_a_llamar",     label: "Volver a llamar" },
  { value: "ocupado_en_reunion",  label: "Ocupado / En reunión" },
  { value: "prometio_llamar",     label: "Prometió llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
  { value: "no_habido",           label: "No habido" },
  { value: "perdida",             label: "Venta perdida" },
  { value: "venta_ganada",        label: "Venta ganada" },
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

const PIDE_MOTIVO  = ["no_interesado", "ya_tiene_proveedor"];
const PIDE_ACCION  = ["interesado", "solicita_informacion", "volver_a_llamar", "ocupado_en_reunion", "prometio_llamar"];
// Estados en los que no tiene sentido registrar hora de fin (no hubo contacto real)
const SIN_HORA_FIN = ["", "no_contesta", "buzon_de_voz", "fuera_de_servicio", "baja_de_oficio", "suspension_temporal", "no_habido", "venta_ganada"];

const getNowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};

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

interface LlamadaFormProps {
  abierto:      boolean;
  onCerrar:     () => void;
  onGuardado?:  () => void;
  prospectoId?: string;   // desde ProspectoDetalle — ya conocido
  prospectos?:  any[];    // desde LlamadasPage — muestra selector
}

export function LlamadaForm({ abierto, onCerrar, onGuardado, prospectoId, prospectos }: LlamadaFormProps) {
  const [prospectoSel, setProspectoSel] = useState("");
  const [form, setForm] = useState({
    fecha:             fechaHoy(),
    hora_inicio:       getNowTime(),
    hora_fin:          "",
    canal:             "llamada",
    contestada:        false,
    resultado:         "",
    motivo_no_interes: "",
    accion_acordada:   "",
    notas:             "",
    intentos:          1,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const idEfectivo = prospectoId ?? prospectoSel;
  const horaFinDesactivada = SIN_HORA_FIN.includes(form.resultado);

  function reset() {
    setProspectoSel("");
    setForm({ fecha: fechaHoy(), hora_inicio: getNowTime(), hora_fin: "", canal: "llamada", contestada: false, resultado: "", motivo_no_interes: "", accion_acordada: "", notas: "", intentos: 1 });
    setError(null);
  }

  async function handleGuardar() {
    if (!idEfectivo) return;
    setLoading(true);
    setError(null);
    try {
      await crearLlamada({
        prospecto_id:      idEfectivo,
        fecha:             toLocalISOString(form.fecha, form.hora_inicio),
        hora_fin:          form.hora_fin          || undefined,
        canal:             form.canal,
        contestada:        form.contestada,
        resultado:         form.resultado         || undefined,
        motivo_no_interes: PIDE_MOTIVO.includes(form.resultado) ? (form.motivo_no_interes || undefined) : undefined,
        accion_acordada:   (form.contestada && PIDE_ACCION.includes(form.resultado)) ? (form.accion_acordada || undefined) : undefined,
        notas:             form.notas             || undefined,
        intentos:          form.intentos,
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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar llamada" variant="dark">
      <div className="space-y-4">

        {/* Selector de prospecto — solo cuando viene de LlamadasPage */}
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
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
          <Field icon={<Calendar size={14}/>} label="Fecha">
            <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className={fi} />
          </Field>
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest block mb-1.5">Canal</label>
            <select value={form.canal} onChange={e => set("canal", e.target.value)} className={sel}>
              {CANALES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {form.canal === "llamada" && <>
            <Field icon={<Clock size={14}/>} label="Hora inicio">
              <input type="time" value={form.hora_inicio} onChange={e => set("hora_inicio", e.target.value)} className={fi} />
            </Field>
            <div style={horaFinDesactivada ? { opacity: 0.35, pointerEvents: "none" } : {}}>
              <Field icon={<Clock size={14}/>} label={horaFinDesactivada ? "Hora fin (N/A)" : "Hora fin (opcional)"}>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={e => set("hora_fin", e.target.value)}
                  disabled={horaFinDesactivada}
                  className={fi}
                />
              </Field>
            </div>
          </>}
        </div>

        {/* Estado del lead */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-3">
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Activity size={11} className="text-yellow-500"/>Estado del lead
            </label>
            <select value={form.resultado} onChange={e => {
              const v = e.target.value;
              set("resultado", v);
              set("motivo_no_interes", "");
              if (SIN_HORA_FIN.includes(v)) set("hora_fin", "");
            }} className={sel}>
              <option value="">Sin resultado</option>
              {RESULTADOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {PIDE_MOTIVO.includes(form.resultado) && (
            <div className="rounded-xl bg-red-950/40 border border-red-800/40 p-3">
              <label className="text-[10px] text-red-400 font-semibold uppercase tracking-widest block mb-1.5">Motivo de descarte</label>
              <select value={form.motivo_no_interes} onChange={e => set("motivo_no_interes", e.target.value)} className={sel}>
                <option value="">Sin especificar</option>
                {MOTIVOS_DESCARTE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          {form.contestada && PIDE_ACCION.includes(form.resultado) && (
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-700/40 p-3">
              <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 size={11}/>Acción acordada
              </label>
              <select value={form.accion_acordada} onChange={e => set("accion_acordada", e.target.value)} className={sel}>
                <option value="">Sin definir</option>
                {ACCIONES_ACORDADAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
            <input type="checkbox" checked={form.contestada}
              onChange={e => set("contestada", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 accent-brand" />
            <span className="flex items-center gap-1.5 text-xs text-zinc-300">
              <Phone size={12} className="text-yellow-500"/>¿Fue contestada?
            </span>
          </label>

          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Hash size={11} className="text-yellow-500"/>Intentos de llamada
            </label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("intentos", n)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                    form.intentos === n
                      ? "bg-brand border-brand text-zinc-900"
                      : "bg-zinc-900 border-zinc-600 text-zinc-400 hover:border-brand/50 hover:text-zinc-200"
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={20}
                value={form.intentos > 5 ? form.intentos : ""}
                placeholder={form.intentos > 5 ? String(form.intentos) : "+5"}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= 20) set("intentos", v);
                }}
                className="w-14 h-9 rounded-xl text-xs text-center bg-zinc-900 border border-zinc-600 text-zinc-300 focus:outline-none focus:border-brand/50 placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
          <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <StickyNote size={11} className="text-yellow-500"/>Notas
          </label>
          <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
            placeholder="Observaciones de la llamada..."
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
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
