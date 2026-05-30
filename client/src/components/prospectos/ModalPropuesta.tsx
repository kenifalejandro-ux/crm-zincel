/** client/src/components/propuestas/ModalPropuesta.tsx */

import type { ReactNode } from "react";
import { Briefcase, Package, FileText, Banknote, DollarSign, Tag, Calendar, StickyNote, ArrowLeftRight } from "lucide-react";
import type { FormPropuesta, ServicioPropuesta, EstadoPropuesta } from "../../types/propuesta.types";
import { LABEL_SERVICIO, LABEL_ESTADO } from "../../types/propuesta.types";

const SERVICIOS = Object.keys(LABEL_SERVICIO) as ServicioPropuesta[];
const ESTADOS   = Object.keys(LABEL_ESTADO)   as EstadoPropuesta[];

const PAQUETES_WEB = [
  { value: "base_web_express",   label: "Base — Web Express",   precio: 500,  rango: "S/ 500 – 700",    dias: "3 a 5 días"       },
  { value: "gold_web_pro",       label: "Gold — Web Pro",       precio: 900,  rango: "S/ 900 – 1,200",  dias: "7 a 10 días"      },
  { value: "red_web_advanced",   label: "Red — Web Advanced",   precio: 1300, rango: "S/ 1,300 – 1,600", dias: "12 a 15 días"    },
  { value: "blue_web_expert",    label: "Blue — Web Expert",    precio: 1700, rango: "S/ 1,700 – 2,000", dias: "15 a 20 días"    },
  { value: "platinum_elite",     label: "Platinum — Elite",     precio: 2000, rango: "Desde S/ 2,000+",  dias: "Según proyecto"  },
];

const sel = "w-full px-3 py-2.5 text-xs bg-zinc-800 border border-yellow-300/30 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-all";

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 bg-zinc-800 p-4 rounded-2xl">
      <label className="text-[10px]  text-zinc-400 font-semibold uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2.5 border-b border-zinc-600 pb-1.5 focus-within:border-brand transition-colors">
        <span className="text-yellow-500 shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  );
}

const fi = "flex-1 text-xs text-zinc-100 bg-transparent outline-none placeholder:text-zinc-500 min-w-0 [color-scheme:dark]";

interface Props {
  form:         FormPropuesta;
  cargando:     boolean;
  onFormChange: (form: FormPropuesta) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalPropuesta({ form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormPropuesta>) => onFormChange({ ...form, ...campo });
  const paqueteActual = PAQUETES_WEB.find(p => p.label === form.descripcion);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-800 p-4 rounded-2xl rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-zinc-700">
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-4 rounded-full bg-brand block shrink-0" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Nueva propuesta</h2>
        </div>

        {/* Servicio + Paquete */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Briefcase size={11} className="text-yellow-500"/>Tipo de servicio
            </label>
            <select
              value={form.servicio}
              onChange={(e) => set({ servicio: e.target.value as ServicioPropuesta, descripcion: "", monto_propuesto: "" })}
              className={sel}
            >
              {SERVICIOS.map((s) => (
                <option key={s} value={s}>{LABEL_SERVICIO[s]}</option>
              ))}
            </select>
          </div>

          {form.servicio === "desarrollo_web" && (
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Package size={11} className="text-yellow-500"/>Paquete
              </label>
              <select
                value={paqueteActual?.value ?? ""}
                onChange={(e) => {
                  const pkg = PAQUETES_WEB.find(p => p.value === e.target.value);
                  if (pkg) set({ descripcion: pkg.label, monto_propuesto: String(pkg.precio), moneda: "PEN" });
                  else     set({ descripcion: "", monto_propuesto: "" });
                }}
                className={sel}
              >
                <option value="">Selecciona un paquete...</option>
                {PAQUETES_WEB.map(p => (
                  <option key={p.value} value={p.value}>{p.label} — {p.rango}</option>
                ))}
              </select>
            </div>
          )}

          <Field icon={<FileText size={14}/>} label={form.servicio === "desarrollo_web" ? "Descripción / detalle adicional" : "Descripción"}>
            <input type="text" value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })}
              placeholder={form.servicio === "desarrollo_web" ? "Detalles específicos del proyecto..." : "Ej: Desarrollo de landing page"}
              className={fi} />
          </Field>
        </div>

        {/* Moneda + Monto */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Banknote size={11} className="text-yellow-500"/>Moneda
            </label>
            <select value={form.moneda} onChange={(e) => set({ moneda: e.target.value as "PEN" | "USD" })} className={sel}>
              <option value="PEN">S/ Soles (PEN)</option>
              <option value="USD">$ Dólares (USD)</option>
            </select>
          </div>
          <Field icon={<DollarSign size={14}/>} label="Monto propuesto">
            <input type="number" min="0" step="0.01" value={form.monto_propuesto}
              onChange={(e) => set({ monto_propuesto: e.target.value })}
              placeholder="0.00" className={fi} />
          </Field>

          {form.moneda === "USD" && (
            <div className="col-span-2">
              <Field icon={<ArrowLeftRight size={14}/>} label="Tipo de cambio (USD → PEN)">
                <input type="number" min="1" step="0.001" value={form.tipo_cambio}
                  onChange={(e) => set({ tipo_cambio: e.target.value })}
                  placeholder="3.750" className={fi} />
              </Field>
            </div>
          )}
        </div>

        {/* Estado + Fecha */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Tag size={11} className="text-yellow-500"/>Estado
            </label>
            <select value={form.estado} onChange={(e) => set({ estado: e.target.value as EstadoPropuesta })} className={sel}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{LABEL_ESTADO[e]}</option>
              ))}
            </select>
          </div>
          <Field icon={<Calendar size={14}/>} label="Fecha de propuesta">
            <input type="date" value={form.fecha_propuesta} onChange={(e) => set({ fecha_propuesta: e.target.value })} className={fi} />
          </Field>
        </div>

        {/* Notas */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
          <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <StickyNote size={11} className="text-yellow-500"/>Notas
          </label>
          <textarea rows={2} value={form.notas} onChange={(e) => set({ notas: e.target.value })}
            placeholder="Detalles adicionales de la propuesta..."
            className="w-full text-xs bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/25 resize-none" />
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button onClick={onCerrar}
            className="flex-1 px-4 py-2 text-xs border border-zinc-600 rounded-xl hover:bg-zinc-800 text-zinc-400 transition">
            Cancelar
          </button>
          <button onClick={onGuardar}
            disabled={cargando || !form.descripcion || !form.monto_propuesto}
            className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-xl transition font-medium">
            {cargando ? "Guardando..." : "Registrar propuesta"}
          </button>
        </div>
      </div>
    </div>
  );
}
