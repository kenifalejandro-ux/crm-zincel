/**client/src/components/reuniones/ReunionForm.tsx */

import { useState } from "react";
import type { ReactNode } from "react";
import { AlignLeft, Calendar, Clock, Link, StickyNote, AlertCircle, Users, Search } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { crearReunion } from "../../services/reuniones.api";
import { toLocalISOString, fechaHoy } from "../../utils/date";
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

const HORAS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [hh, mm] = value ? value.split(":") : ["", ""];
  const selCls = "px-2 py-1.5 text-xs bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-1.5 border-b border-zinc-600 pb-1.5">
        <Clock size={14} className="text-yellow-500 shrink-0" />
        <select value={hh} onChange={e => onChange(`${e.target.value}:${mm || "00"}`)} className={selCls}>
          <option value="">HH</option>
          {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-zinc-400 font-bold">:</span>
        <select value={mm} onChange={e => onChange(`${hh || "00"}:${e.target.value}`)} className={selCls}>
          <option value="">MM</option>
          {MINUTOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {hh && <span className="text-[11px] text-zinc-400 font-medium">{parseInt(hh) < 12 ? "a.m." : "p.m."}</span>}
      </div>
    </div>
  );
}

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
  const [busqueda,     setBusqueda]     = useState("");
  const [form, setForm] = useState({
    titulo: "", fecha: fechaHoy(), hora_inicio: "", modalidad: "google_meet" as ModalidadReunion,
    enlace: "", notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const idEfectivo = prospectoId ?? prospectoSel;

  function reset() {
    setProspectoSel("");
    setBusqueda("");
    setForm({ titulo: "", fecha: fechaHoy(), hora_inicio: "", modalidad: "google_meet", enlace: "", notas: "" });
    setError(null);
  }

  async function handleGuardar() {
    if (!idEfectivo || !form.titulo || !form.fecha || !form.hora_inicio) return;
    setLoading(true);
    setError(null);
    try {
      await crearReunion({
        prospecto_id: idEfectivo,
        titulo:       form.titulo,
        fecha_hora:   toLocalISOString(form.fecha, form.hora_inicio),
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
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-2">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <Users size={11} className="text-yellow-500"/>Prospecto *
            </label>

            {/* Prospecto ya seleccionado */}
            {prospectoSel ? (() => {
              const p = prospectos.find(x => x.id === prospectoSel);
              return p ? (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-900/40 border border-emerald-700/50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-300 truncate">{p.empresa}</p>
                    {p.nombre_contacto && <p className="text-[11px] text-emerald-500 truncate">{p.nombre_contacto}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setProspectoSel(""); setBusqueda(""); }}
                    className="text-[10px] text-zinc-400 hover:text-red-400 ml-2 shrink-0 transition"
                  >
                    Cambiar
                  </button>
                </div>
              ) : null;
            })() : (
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  autoFocus
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Escribe empresa o contacto..."
                  className="w-full pl-8 pr-3 py-2.5 text-xs bg-zinc-900 border border-zinc-600 rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50"
                />
                {busqueda && (
                  <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-600 bg-zinc-900 divide-y divide-zinc-800">
                    {prospectos
                      .filter(p =>
                        `${p.empresa} ${p.nombre_contacto || ""} ${p.telefono || ""}`.toLowerCase().includes(busqueda.toLowerCase())
                      )
                      .slice(0, 20)
                      .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setProspectoSel(p.id); setBusqueda(""); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-zinc-700 transition"
                        >
                          <p className="text-xs font-medium text-zinc-200 truncate">{p.empresa}</p>
                          {p.nombre_contacto && <p className="text-[11px] text-zinc-400 truncate">{p.nombre_contacto}</p>}
                        </button>
                      ))
                    }
                    {prospectos.filter(p =>
                      `${p.empresa} ${p.nombre_contacto || ""} ${p.telefono || ""}`.toLowerCase().includes(busqueda.toLowerCase())
                    ).length === 0 && (
                      <p className="text-xs text-zinc-500 text-center py-3">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Título + Fecha + Hora + Modalidad */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-4">
          <Field icon={<AlignLeft size={14}/>} label="Título *">
            <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
              placeholder="Ej: Primera reunión de presentación" className={fi} />
          </Field>

          <div className="grid grid-cols-2 gap-x-6">
            <Field icon={<Calendar size={14}/>} label="Fecha *">
              <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className={fi} />
            </Field>
            <TimePicker value={form.hora_inicio} onChange={v => set("hora_inicio", v)} label="Hora inicio *" />
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest block mb-1.5">Modalidad</label>
            <select value={form.modalidad} onChange={e => set("modalidad", e.target.value)} className={sel}>
              {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
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
            disabled={!idEfectivo || !form.titulo || !form.fecha || !form.hora_inicio} onClick={handleGuardar}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
