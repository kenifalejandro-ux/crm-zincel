/** client/src/components/finanzas/ModalEmpresaAnalisis.tsx — PREMIUM NEON
 * Rediseño visible: borde con glow de acento, barra + icono en header, SECTOR como chips
 * (antes <select> plano), MONEDA como segmentado, botón premium. Lógica/props INTACTAS.
 */

import { useState } from "react";
import { X, Building2 } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "rgba(10,16,31,0.97)",
          border: "1px solid rgb(var(--accent) / 0.28)",
          boxShadow: "0 0 40px rgb(var(--accent) / calc(0.18*var(--glow))), 0 24px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header con barra de acento + icono */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full block shrink-0" style={{ background: "rgb(var(--accent))", boxShadow: "0 0 10px rgb(var(--accent))" }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgb(var(--accent) / 0.12)", border: "1px solid rgb(var(--accent) / 0.3)", color: "rgb(var(--accent))" }}>
                <Building2 size={14} />
              </div>
              <h2 className="font-display text-sm font-bold text-zinc-100 uppercase tracking-widest">
                {esEdicion ? "Editar empresa" : "Registrar empresa"}
              </h2>
            </div>
          </div>
          <button onClick={onCerrar} className="p-1.5 hover:bg-white/5 rounded-lg transition">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              placeholder="ej. RL Safety SAC"
              className="neon-input w-full px-3 py-2.5 text-xs"
              required
            />
          </div>

          {/* Sector como chips */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Sector</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORES.map(s => {
                const act = form.sector === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("sector", act ? "" : s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      act ? "bg-accent-15 text-accent border-accent-30" : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200"
                    }`}
                    style={act ? { boxShadow: "0 0 12px rgb(var(--accent) / calc(0.18*var(--glow)))" } : undefined}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Moneda segmentado */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Moneda</label>
            <div className="flex gap-1.5 p-1 neon-panel w-max">
              {([["PEN", "S/ Soles"], ["USD", "$ Dólares"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("moneda", v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    form.moneda === v ? "bg-accent-15 text-accent border border-accent-30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => set("notas", e.target.value)}
              rows={2}
              placeholder="Información adicional de la empresa..."
              className="neon-input w-full px-3 py-2.5 text-xs resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-2.5 text-xs border border-white/10 text-zinc-300 rounded-xl hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !form.nombre.trim()}
              className="btn-primary flex-1 px-4 py-2.5 text-xs disabled:opacity-50"
            >
              {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Registrar empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}