/** src/components/metricas/FiltrosMetricas.tsx — REDISEÑO NEON
 * Antes: inputs TEMA CLARO (border-slate-200 bg-white text-slate-700). Ahora: neon-input.
 * Lógica/props (filtros, empresas, onChange) INTACTOS.
 */
import { FiltrosMetrica, SubPlataforma } from "../../types/metricas.types";

interface Props {
  filtros: FiltrosMetrica;
  empresas: string[];
  onChange: (f: FiltrosMetrica) => void;
}

const SUB_PLATAFORMAS = [
  { value: "", label: "Facebook + Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "audience_network", label: "Audience Network" },
];

export const FiltrosMetricas = ({ filtros, onChange }: Props) => (
  <div className="flex flex-wrap gap-2.5 items-center">
    {filtros.plataforma === "meta" && (
      <select
        value={filtros.sub_plataforma ?? ""}
        onChange={(e) => onChange({ ...filtros, sub_plataforma: e.target.value as SubPlataforma | "" })}
        className="neon-input text-xs px-3 py-2"
      >
        {SUB_PLATAFORMAS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    )}

    <div className="h-5 w-px bg-white/10" />

    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-zinc-500">Desde</span>
      <input type="date" value={filtros.desde ?? ""} onChange={(e) => onChange({ ...filtros, desde: e.target.value || undefined })} className="neon-input text-xs px-3 py-1.5" />
    </div>

    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-zinc-500">Hasta</span>
      <input type="date" value={filtros.hasta ?? ""} onChange={(e) => onChange({ ...filtros, hasta: e.target.value || undefined })} className="neon-input text-xs px-3 py-1.5" />
    </div>

    {(filtros.desde || filtros.hasta) && (
      <button onClick={() => onChange({ ...filtros, desde: undefined, hasta: undefined })} className="text-[11px] text-zinc-500 hover:text-accent underline transition">
        Limpiar
      </button>
    )}
  </div>
);