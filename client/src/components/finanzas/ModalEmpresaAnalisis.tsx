/** client/src/components/finanzas/ModalEmpresaAnalisis.tsx */

import { useState } from "react";
import { X } from "lucide-react";
import type { FormEmpresa, EmpresaAnalisis } from "../../types/analisisEmpresas.types";

interface Props {
  empresa?: EmpresaAnalisis | null;
  guardando: boolean;
  onGuardar: (form: FormEmpresa) => void;
  onCerrar: () => void;
}

const formInicial = (e?: EmpresaAnalisis | null): FormEmpresa => ({
  nombre: e?.nombre ?? "",
  sector: e?.sector ?? "",
  moneda: e?.moneda ?? "PEN",
  notas:  e?.notas  ?? "",
});

const SECTORES = [
  "Servicios profesionales", "Tecnología", "Comercio", "Manufactura",
  "Construcción", "Salud", "Educación", "Transporte", "Gastronomía",
  "Seguridad", "Agropecuario", "Energía", "Otro",
];

export function ModalEmpresaAnalisis({ empresa, guardando, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEmpresa>(() => formInicial(empresa));
  const esEdicion = !!empresa;

  const set = (campo: keyof FormEmpresa, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onGuardar(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-800">
            {esEdicion ? "Editar empresa" : "Registrar empresa"}
          </h2>
          <button onClick={onCerrar} className="p-1.5 hover:bg-zinc-100 rounded-lg transition">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-700 block mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              placeholder="ej. RL Safety SAC"
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1">Sector</label>
              <select
                value={form.sector}
                onChange={e => set("sector", e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 bg-white"
              >
                <option value="">Sin especificar</option>
                {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1">Moneda</label>
              <select
                value={form.moneda}
                onChange={e => set("moneda", e.target.value as "PEN" | "USD")}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 bg-white"
              >
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => set("notas", e.target.value)}
              rows={2}
              placeholder="Información adicional de la empresa..."
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-2 text-xs border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !form.nombre.trim()}
              className="flex-1 px-4 py-2 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Registrar empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
