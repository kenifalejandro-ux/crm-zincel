/** client/src/components/finanzas/ModalPeriodoFinanciero.tsx */

import { MODAL_BASE, INPUT_BASE } from "../../lib/tokens";
import { useState } from "react";
import { X } from "lucide-react";
import type { FormPeriodo, PeriodoFinanciero } from "../../types/analisisEmpresas.types";

interface Props {
  empresaNombre: string;
  periodo?: PeriodoFinanciero | null;
  guardando: boolean;
  onGuardar: (form: FormPeriodo) => void;
  onCerrar: () => void;
}

const formInicial = (p?: PeriodoFinanciero | null): FormPeriodo => ({
  periodo:                     p?.periodo                     ?? "",
  fecha_periodo:               p?.fecha_periodo               ? p.fecha_periodo.split("T")[0] : "",
  caja_bancos:                 p ? String(p.caja_bancos)                 : "0",
  cuentas_por_cobrar:          p ? String(p.cuentas_por_cobrar)          : "0",
  otros_activos_corrientes:    p ? String(p.otros_activos_corrientes)    : "0",
  activo_fijo:                 p ? String(p.activo_fijo)                 : "0",
  otros_activos_no_corrientes: p ? String(p.otros_activos_no_corrientes) : "0",
  pasivos_corrientes:          p ? String(p.pasivos_corrientes)          : "0",
  pasivos_no_corrientes:       p ? String(p.pasivos_no_corrientes)       : "0",
  patrimonio:                  p ? String(p.patrimonio)                  : "0",
  utilidad_ejercicio:          p ? String(p.utilidad_ejercicio)          : "0",
  ventas_netas:                p ? String(p.ventas_netas)                : "0",
  notas:                       p?.notas                      ?? "",
});

function Campo({
  label, name, value, onChange, hint, optional,
}: {
  label: string; name: keyof FormPeriodo; value: string;
  onChange: (n: keyof FormPeriodo, v: string) => void;
  hint?: string; optional?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-zinc-400 block mb-1">
        {label}
        {optional && <span className="text-zinc-400 ml-1">(opcional)</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(name, e.target.value)}
        step="0.01"
        min="0"
        className={`${INPUT_BASE} w-full px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400`}
      />
      {hint && <p className="text-[10px] text-zinc-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export function ModalPeriodoFinanciero({ empresaNombre, periodo, guardando, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormPeriodo>(() => formInicial(periodo));
  const esEdicion = !!periodo;

  const set = (campo: keyof FormPeriodo, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.periodo.trim() || !form.fecha_periodo) return;
    onGuardar(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`${MODAL_BASE} w-full max-w-2xl my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              {esEdicion ? "Editar período" : "Nuevo período financiero"}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">{empresaNombre}</p>
          </div>
          <button onClick={onCerrar} className="p-1.5 hover:bg-zinc-800 rounded-lg transition">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Identificación del período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">Período *</label>
              <input
                value={form.periodo}
                onChange={e => set("periodo", e.target.value)}
                placeholder="ej. Q1 2026, Abril 2026, FY2025"
                className={`${INPUT_BASE} w-full px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400`}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400 block mb-1">Fecha de cierre *</label>
              <input
                type="date"
                value={form.fecha_periodo}
                onChange={e => set("fecha_periodo", e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-400`}
                required
              />
            </div>
          </div>

          {/* Activos corrientes */}
          <div>
            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest mb-3">Activos Corrientes</p>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Caja y Bancos"            name="caja_bancos"              value={form.caja_bancos}              onChange={set} hint="Efectivo disponible" />
              <Campo label="Cuentas por Cobrar"       name="cuentas_por_cobrar"       value={form.cuentas_por_cobrar}       onChange={set} hint="CxC pendientes" />
              <Campo label="Otros Activos Corrientes" name="otros_activos_corrientes" value={form.otros_activos_corrientes} onChange={set} optional hint="Inventarios, prepagos..." />
            </div>
          </div>

          {/* Activos no corrientes */}
          <div>
            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest mb-3">Activos No Corrientes</p>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Activo Fijo"                    name="activo_fijo"                  value={form.activo_fijo}                  onChange={set} optional hint="Maquinaria, equipos, inmuebles" />
              <Campo label="Otros Activos No Corrientes"   name="otros_activos_no_corrientes"  value={form.otros_activos_no_corrientes}  onChange={set} optional hint="Intangibles, inversiones LP..." />
            </div>
          </div>

          {/* Pasivos */}
          <div>
            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest mb-3">Pasivos</p>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Pasivos Corrientes (corto plazo)"  name="pasivos_corrientes"     value={form.pasivos_corrientes}     onChange={set} hint="Deudas a pagar &lt; 1 año" />
              <Campo label="Pasivos No Corrientes (largo plazo)" name="pasivos_no_corrientes" value={form.pasivos_no_corrientes} onChange={set} optional hint="Deudas a pagar &gt; 1 año" />
            </div>
          </div>

          {/* Resultados */}
          <div>
            <p className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest mb-3">Resultados</p>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Patrimonio"          name="patrimonio"          value={form.patrimonio}          onChange={set} hint="Capital propio total" />
              <Campo label="Utilidad del Período" name="utilidad_ejercicio"  value={form.utilidad_ejercicio}  onChange={set} hint="Puede ser negativa" />
              <Campo label="Ventas Netas"        name="ventas_netas"        value={form.ventas_netas}        onChange={set} optional hint="Para calcular margen neto" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => set("notas", e.target.value)}
              rows={2}
              placeholder="Observaciones del período..."
              className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 resize-none`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-2 text-xs border border-white/10 text-zinc-400 rounded-lg hover:bg-zinc-800/40 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 px-4 py-2 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agregar período"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
