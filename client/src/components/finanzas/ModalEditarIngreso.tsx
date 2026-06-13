/** client/src/components/finanzas/ModalEditarIngreso.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import type { TipoServicio, EstadoIngreso, Moneda } from "../../types/finanzas.types";

const cls = "w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
const lbl = "text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1 block";

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
  { value: "vencido",         label: "Vencido" },
];

interface FormEditar {
  empresa:           string;
  descripcion:       string;
  tipo_servicio:     TipoServicio;
  monto_total:       string;
  adelanto:          string;
  moneda:            Moneda;
  tipo_cambio:       string;
  estado:            EstadoIngreso;
  fecha:             string;
  fecha_vencimiento: string;
  notas:             string;
}

function toForm(ing: any): FormEditar {
  return {
    empresa:           ing.empresa ?? "",
    descripcion:       ing.descripcion ?? "",
    tipo_servicio:     ing.tipo_servicio ?? "otro",
    monto_total:       String(ing.monto_total ?? ""),
    adelanto:          String(ing.adelanto ?? "0"),
    moneda:            ing.moneda ?? "PEN",
    tipo_cambio:       String(ing.tipo_cambio ?? "1"),
    estado:            ing.estado ?? "por_cobrar",
    fecha:             ing.fecha?.split("T")[0] ?? "",
    fecha_vencimiento: ing.fecha_vencimiento?.split("T")[0] ?? "",
    notas:             ing.notas ?? "",
  };
}

interface Props {
  ingreso:   any;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditar) => void;
  onCerrar:  () => void;
}

export function ModalEditarIngreso({ ingreso, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditar>(() => toForm(ingreso));
  const set = (campo: Partial<FormEditar>) => setForm((f) => ({ ...f, ...campo }));

  const saldo = Math.max(0, (parseFloat(form.monto_total) || 0) - (parseFloat(form.adelanto) || 0));
  const sym = form.moneda === "USD" ? "$" : "S/";

  return (
    <ModalEditar
      nombre={ingreso.empresa ?? ingreso.descripcion ?? "Ingreso"}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
      size="md"
      variant="dark"
    >
      <div className="space-y-3">

        {ingreso.propuesta_id && (
          <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-700/30 rounded-xl px-3 py-2">
            <span className="text-xs font-medium text-purple-400">Generado desde propuesta</span>
            <span className="text-[10px] text-purple-500 ml-auto font-mono">#{ingreso.propuesta_id.slice(0, 8)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Empresa / Cliente</label>
            <input type="text" value={form.empresa}
              onChange={(e) => set({ empresa: e.target.value })}
              className={cls} placeholder="Empresa XYZ" />
          </div>
          <div>
            <label className={lbl}>Tipo de servicio</label>
            <select value={form.tipo_servicio}
              onChange={(e) => set({ tipo_servicio: e.target.value as TipoServicio })}
              className={cls}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Descripción</label>
          <input type="text" value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
            className={cls} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lbl}>Moneda</label>
            <select value={form.moneda}
              onChange={(e) => set({ moneda: e.target.value as Moneda })}
              className={cls}>
              <option value="PEN">S/ (PEN)</option>
              <option value="USD">$ (USD)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Monto total</label>
            <input type="number" min={0} step="0.01" value={form.monto_total}
              onChange={(e) => set({ monto_total: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className={lbl}>Cobrado</label>
            <input type="number" min={0} step="0.01"
              max={parseFloat(form.monto_total) || undefined}
              value={form.adelanto}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                const max = parseFloat(form.monto_total) || 0;
                set({ adelanto: max > 0 ? String(Math.min(v, max)) : e.target.value });
              }}
              className={cls} />
          </div>
        </div>

        {form.moneda === "USD" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs">
            <span className="text-amber-400 font-medium">TC al registrar:</span>
            <span className="text-amber-500">S/</span>
            <input type="number" min={1} step={0.01} value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              className={`${INPUT_BASE} w-20 px-2 py-1 border-zinc-600 rounded text-xs text-center text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400 [color-scheme:dark]`} />
            <span className="text-amber-500">/ USD</span>
            <span className="text-zinc-500 ml-auto">Se guarda con el registro</span>
          </div>
        )}

        {parseFloat(form.monto_total) > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-orange-900/20 rounded-lg border border-orange-700/30">
            <span className="text-xs text-orange-400 font-medium">Saldo pendiente</span>
            <span className="text-xs font-bold text-orange-400">
              {sym} {saldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Estado</label>
            <select value={form.estado}
              onChange={(e) => set({ estado: e.target.value as EstadoIngreso })}
              className={cls}>
              {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Fecha de emisión</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
        </div>

        <div>
          <label className={lbl}>Fecha de vencimiento <span className="normal-case">(opcional)</span></label>
          <input type="date" value={form.fecha_vencimiento}
            onChange={(e) => set({ fecha_vencimiento: e.target.value })}
            className={cls} />
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea value={form.notas} onChange={(e) => set({ notas: e.target.value })}
            rows={2} className={`${cls} resize-none`} />
        </div>

      </div>
    </ModalEditar>
  );
}
