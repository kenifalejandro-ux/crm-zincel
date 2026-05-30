/** client/src/components/finanzas/ModalIngreso.tsx */

import type { ReactNode } from "react";
import { Building2, Briefcase, FileText, Banknote, DollarSign, Wallet, Tag, Calendar, StickyNote, ArrowLeftRight } from "lucide-react";
import type { FormIngreso, TipoServicio, EstadoIngreso, Moneda } from "../../types/finanzas.types";

const sel = "w-full px-3 py-2.5 text-xs bg-zinc-800 border border-yellow-300/30 rounded-xl text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-all";
const fi  = "flex-1 text-xs text-zinc-100 bg-transparent outline-none placeholder:text-zinc-500 min-w-0 [color-scheme:dark]";

const TIPOS: { value: TipoServicio; label: string }[] = [
  { value: "desarrollo_web",    label: "Desarrollo web (a medida)" },
  { value: "wordpress",         label: "WordPress" },
  { value: "diseño_marketing",  label: "Diseño & Marketing" },
  { value: "redes_sociales",    label: "Redes sociales" },
  { value: "publicidad_digital",label: "Publicidad digital" },
  { value: "erp",               label: "ERP" },
  { value: "crm",               label: "CRM" },
  { value: "otro",              label: "Otro" },
];

const ESTADOS: { value: EstadoIngreso; label: string }[] = [
  { value: "por_cobrar",      label: "Por cobrar" },
  { value: "cobrado_parcial", label: "Cobrado parcial" },
  { value: "cobrado",         label: "Cobrado" },
];

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

interface Props {
  form:         FormIngreso;
  cargando:     boolean;
  onFormChange: (form: FormIngreso) => void;
  onGuardar:    () => void;
  onCerrar:     () => void;
}

export function ModalIngreso({ form, cargando, onFormChange, onGuardar, onCerrar }: Props) {
  const set = (campo: Partial<FormIngreso>) => onFormChange({ ...form, ...campo });

  const saldo = Math.max(0, (parseFloat(form.monto_total) || 0) - (parseFloat(form.adelanto) || 0));
  const sym = form.moneda === "USD" ? "$" : "S/";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-zinc-700">
          <span className="w-1 h-4 rounded-full bg-brand block shrink-0" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Agregar ingreso</h2>
        </div>

        <div className="p-6 space-y-4">

          {/* Empresa + Tipo */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <Field icon={<Building2 size={14}/>} label="Empresa / Cliente">
              <input type="text" value={form.empresa}
                onChange={(e) => set({ empresa: e.target.value })}
                placeholder="Ej: Empresa XYZ" className={fi} />
            </Field>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Briefcase size={11} className="text-yellow-500"/>Tipo de servicio
              </label>
              <select value={form.tipo_servicio}
                onChange={(e) => set({ tipo_servicio: e.target.value as TipoServicio })}
                className={sel}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
            <Field icon={<FileText size={14}/>} label="Descripción">
              <input type="text" value={form.descripcion}
                onChange={(e) => set({ descripcion: e.target.value })}
                placeholder="Ej: Gestión de redes sociales mes de mayo" className={fi} />
            </Field>
          </div>

          {/* Moneda + Monto + Cobrado */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-3 gap-x-4 gap-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Banknote size={11} className="text-yellow-500"/>Moneda
              </label>
              <select value={form.moneda}
                onChange={(e) => set({ moneda: e.target.value as Moneda })}
                className={sel}>
                <option value="PEN">S/ (PEN)</option>
                <option value="USD">$ (USD)</option>
              </select>
            </div>
            <Field icon={<DollarSign size={14}/>} label="Monto total">
              <input type="number" min={0} step="0.01" value={form.monto_total}
                onChange={(e) => set({ monto_total: e.target.value })}
                placeholder="0.00" className={fi} />
            </Field>
            <Field icon={<Wallet size={14}/>} label="Cobrado">
              <input type="number" min={0} step="0.01"
                max={parseFloat(form.monto_total) || undefined}
                value={form.adelanto}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  const max = parseFloat(form.monto_total) || 0;
                  set({ adelanto: max > 0 ? String(Math.min(v, max)) : e.target.value });
                }}
                placeholder="0.00" className={fi} />
            </Field>

            {/* TC — solo si USD */}
            {form.moneda === "USD" && (
              <div className="col-span-3 flex items-center gap-2 px-3 py-2 bg-amber-950/40 border border-amber-700/40 rounded-xl text-xs">
                <ArrowLeftRight size={12} className="text-yellow-500"/>
                <span className="text-amber-400 font-medium">TC al registrar: S/</span>
                <input type="number" min={1} step={0.01} value={form.tipo_cambio}
                  onChange={(e) => set({ tipo_cambio: e.target.value })}
                  className="w-20 px-2 py-1 border border-amber-700/50 rounded-lg text-xs text-center bg-zinc-800 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand [color-scheme:dark]" />
                <span className="text-amber-400">/ USD</span>
                <span className="text-zinc-500 ml-auto text-[10px]">Se guarda con el registro</span>
              </div>
            )}

            {/* Saldo calculado */}
            {(parseFloat(form.monto_total) > 0) && (
              <div className="col-span-3 flex items-center justify-between px-3 py-2 bg-orange-950/40 border border-orange-700/40 rounded-xl">
                <span className="text-xs text-orange-400 font-medium">Saldo pendiente</span>
                <span className="text-xs font-bold text-orange-400">
                  {sym} {saldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Estado + Fechas */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Tag size={11} className="text-yellow-500"/>Estado
              </label>
              <select value={form.estado}
                onChange={(e) => set({ estado: e.target.value as EstadoIngreso })}
                className={sel}>
                {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <Field icon={<Calendar size={14}/>} label="Fecha de emisión">
              <input type="date" value={form.fecha}
                onChange={(e) => set({ fecha: e.target.value })} className={fi} />
            </Field>
            <div className="col-span-2">
              <Field icon={<Calendar size={14}/>} label="Fecha de vencimiento (opcional)">
                <input type="date" value={form.fecha_vencimiento}
                  onChange={(e) => set({ fecha_vencimiento: e.target.value })} className={fi} />
              </Field>
            </div>
          </div>

          {/* Notas */}
          <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <StickyNote size={11} className="text-yellow-500"/>Notas
            </label>
            <textarea rows={2} value={form.notas}
              onChange={(e) => set({ notas: e.target.value })}
              className="w-full text-xs bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/25 resize-none" />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button onClick={onCerrar}
              className="flex-1 px-4 py-2 text-xs border border-zinc-600 rounded-xl hover:bg-zinc-800 text-zinc-400 transition">
              Cancelar
            </button>
            <button onClick={onGuardar}
              disabled={cargando || !form.empresa || !form.descripcion || !form.monto_total}
              className="flex-1 px-4 py-2 text-xs bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-xl transition font-medium">
              {cargando ? "Guardando..." : "Guardar ingreso"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
