/** client/src/components/finanzas/ModalEditarEgreso.tsx */

import { useState } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import type { CategoriaEgreso, FrecuenciaEgreso, EstadoEgreso, Moneda } from "../../types/finanzas.types";

const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50";

const CATEGORIAS: { value: CategoriaEgreso; label: string }[] = [
  { value: "publicidad_digital",      label: "Publicidad digital" },
  { value: "herramientas_saas",       label: "Herramientas & SaaS" },
  { value: "herramientas_ia",         label: "Herramientas IA" },
  { value: "infraestructura_digital", label: "Infraestructura digital" },
  { value: "subcontratos",            label: "Subcontratos" },
];

const FRECUENCIAS: { value: FrecuenciaEgreso; label: string }[] = [
  { value: "unico",   label: "Único" },
  { value: "mensual", label: "Mensual" },
  { value: "anual",   label: "Anual" },
];

interface FormEditar {
  categoria:         CategoriaEgreso;
  descripcion:       string;
  proveedor:         string;
  monto:             string;
  moneda:            Moneda;
  tipo_cambio:       string;
  frecuencia:        FrecuenciaEgreso;
  estado:            EstadoEgreso;
  fecha:             string;
  fecha_vencimiento: string;
  notas:             string;
}

function toForm(eg: any): FormEditar {
  return {
    categoria:         eg.categoria ?? "publicidad_digital",
    descripcion:       eg.descripcion ?? "",
    proveedor:         eg.proveedor ?? "",
    monto:             String(eg.monto ?? ""),
    moneda:            eg.moneda ?? "PEN",
    tipo_cambio:       String(eg.tipo_cambio ?? "1"),
    frecuencia:        eg.frecuencia ?? "unico",
    estado:            eg.estado ?? "pendiente",
    fecha:             eg.fecha?.split("T")[0] ?? "",
    fecha_vencimiento: eg.fecha_vencimiento?.split("T")[0] ?? "",
    notas:             eg.notas ?? "",
  };
}

interface Props {
  egreso:    any;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditar) => void;
  onCerrar:  () => void;
}

export function ModalEditarEgreso({ egreso, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditar>(() => toForm(egreso));
  const set = (campo: Partial<FormEditar>) => setForm((f) => ({ ...f, ...campo }));

  return (
    <ModalEditar
      nombre={egreso.descripcion ?? "Egreso"}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
      size="md"
    >
      <div className="space-y-3">

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
          <select value={form.categoria}
            onChange={(e) => set({ categoria: e.target.value as CategoriaEgreso })}
            className={cls}>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Descripción</label>
            <input type="text" value={form.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Proveedor</label>
            <input type="text" value={form.proveedor}
              onChange={(e) => set({ proveedor: e.target.value })}
              className={cls} placeholder="Opcional" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Moneda</label>
            <select value={form.moneda}
              onChange={(e) => set({ moneda: e.target.value as Moneda })}
              className={cls}>
              <option value="PEN">S/ (PEN)</option>
              <option value="USD">$ (USD)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Monto</label>
            <input type="number" min={0} step="0.01" value={form.monto}
              onChange={(e) => set({ monto: e.target.value })}
              className={cls} />
          </div>
        </div>

        {form.moneda === "USD" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs">
            <span className="text-amber-700 font-medium">TC al registrar:</span>
            <span className="text-amber-600">S/</span>
            <input type="number" min={1} step={0.01} value={form.tipo_cambio}
              onChange={(e) => set({ tipo_cambio: e.target.value })}
              className="w-20 px-2 py-1 border border-amber-200 rounded text-xs text-center bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
            <span className="text-amber-600">/ USD</span>
            <span className="text-amber-500 ml-auto">Se guarda con el registro</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Frecuencia</label>
            <select value={form.frecuencia}
              onChange={(e) => set({ frecuencia: e.target.value as FrecuenciaEgreso })}
              className={cls}>
              {FRECUENCIAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
            <select value={form.estado}
              onChange={(e) => set({ estado: e.target.value as EstadoEgreso })}
              className={cls}>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha del egreso</label>
            <input type="date" value={form.fecha}
              onChange={(e) => set({ fecha: e.target.value })}
              className={cls} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Fecha de vencimiento <span className="text-zinc-400">(renovación/cancelación)</span>
            </label>
            <input type="date" value={form.fecha_vencimiento}
              onChange={(e) => set({ fecha_vencimiento: e.target.value })}
              className={cls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea value={form.notas} onChange={(e) => set({ notas: e.target.value })}
            rows={2} className={`${cls} resize-none`} />
        </div>

      </div>
    </ModalEditar>
  );
}
