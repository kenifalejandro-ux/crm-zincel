/** client/src/components/finanzas/ModalEditarPrestamo.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import type { CategoriaPrestamo, EstadoPrestamo, Moneda } from "../../types/finanzas.types";

const cls = "w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/25 [color-scheme:dark]";
const lbl = "text-[10px] text-zinc-400 font-semibold uppercase tracking-widest mb-1 block";

const CATEGORIAS: { value: CategoriaPrestamo; label: string }[] = [
  { value: "herramientas_ia",         label: "Herramientas IA" },
  { value: "infraestructura_digital", label: "Infraestructura digital" },
  { value: "publicidad_digital",      label: "Publicidad digital" },
  { value: "herramientas_saas",       label: "Herramientas & SaaS" },
  { value: "subcontratos",            label: "Subcontratos" },
  { value: "personal",                label: "Personal" },
  { value: "otro",                    label: "Otro" },
];

interface FormEditar {
  categoria:         CategoriaPrestamo;
  descripcion:       string;
  prestamista:       string;
  monto:             string;
  moneda:            Moneda;
  tipo_cambio:       string;
  estado:            EstadoPrestamo;
  fecha:             string;
  fecha_vencimiento: string;
  fecha_pago:        string;
  notas:             string;
}

function toForm(p: any): FormEditar {
  return {
    categoria:         p.categoria ?? "otro",
    descripcion:       p.descripcion ?? "",
    prestamista:       p.prestamista ?? "",
    monto:             String(p.monto ?? ""),
    moneda:            p.moneda ?? "PEN",
    tipo_cambio:       String(p.tipo_cambio ?? "1"),
    estado:            p.estado === "vencido" ? "por_pagar" : (p.estado ?? "por_pagar"),
    fecha:             p.fecha?.split("T")[0] ?? "",
    fecha_vencimiento: p.fecha_vencimiento?.split("T")[0] ?? "",
    fecha_pago:        p.fecha_pago?.split("T")[0] ?? "",
    notas:             p.notas ?? "",
  };
}

interface Props {
  prestamo:  any;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditar) => void;
  onCerrar:  () => void;
}

export function ModalEditarPrestamo({ prestamo, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditar>(() => toForm(prestamo));
  const set = (campo: Partial<FormEditar>) => setForm((f) => ({ ...f, ...campo }));

  return (
    <ModalEditar
      nombre={prestamo.descripcion ?? "Préstamo"}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
      size="md"
      variant="dark"
    >
      <div className="space-y-3">

        <div>
          <label className={lbl}>¿Para qué fue el préstamo?</label>
          <select value={form.categoria}
            onChange={(e) => set({ categoria: e.target.value as CategoriaPrestamo })}
            className={cls}>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Detalle del préstamo</label>
          <input type="text" value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
            className={cls} />
        </div>

        <div>
          <label className={lbl}>¿A quién le debes?</label>
          <input type="text" value={form.prestamista}
            onChange={(e) => set({ prestamista: e.target.value })}
            className={cls} placeholder="Opcional" />
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
          <div className="col-span-2">
            <label className={lbl}>Monto</label>
            <input type="number" min={0} step="0.01" value={form.monto}
              onChange={(e) => set({ monto: e.target.value })}
              className={cls} />
          </div>
        </div>

        {form.moneda === "USD" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs">
            <span className="text-amber-400 font-medium">TC al registrar:</span>
            <span className="text-amber-500">S/</span>
            <input type="number" min={1} step={0.01} value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              className="w-20 px-2 py-1 border border-zinc-600 rounded text-xs text-center bg-zinc-800 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-400 [color-scheme:dark]" />
            <span className="text-amber-500">/ USD</span>
            <span className="text-zinc-500 ml-auto">Se guarda con el registro</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Estado</label>
            <select value={form.estado}
              onChange={(e) => set({ estado: e.target.value as EstadoPrestamo })}
              className={cls}>
              <option value="por_pagar">Por pagar</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Fecha del préstamo</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
        </div>

        <div>
          <label className={lbl}>Fecha de vencimiento <span className="normal-case">(¿cuándo debes devolverlo?)</span></label>
          <input type="date" value={form.fecha_vencimiento}
            onChange={(e) => set({ fecha_vencimiento: e.target.value })}
            className={cls} />
        </div>

        <div>
          <label className={lbl}>Fecha de pago <span className="normal-case">(opcional — si ya lo pagaste)</span></label>
          <input type="date" value={form.fecha_pago}
            onChange={(e) => set({ fecha_pago: e.target.value })}
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
