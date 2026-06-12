/** src/components/metricas/FiltrosMetricas.tsx */

import { FiltrosMetrica, SubPlataforma } from "../../types/metricas.types";

interface Props {
  filtros:  FiltrosMetrica;
  empresas: string[];
  onChange: (f: FiltrosMetrica) => void;
}

const SUB_PLATAFORMAS = [
  { value: "",                  label: "Facebook + Instagram" },
  { value: "facebook",          label: "Facebook"             },
  { value: "instagram",         label: "Instagram"            },
  { value: "audience_network",  label: "Audience Network"     },
];

const inputCls = "text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition";

export const FiltrosMetricas = ({ filtros, empresas, onChange }: Props) => (
  <div className="flex flex-wrap gap-2.5 items-center">

    {/* Sub plataforma — solo si es Meta (filtro desde sidebar) */}
    {filtros.plataforma === "meta" && (
      <select
        value={filtros.sub_plataforma ?? ""}
        onChange={(e) => onChange({ ...filtros, sub_plataforma: e.target.value as SubPlataforma | "" })}
        className={inputCls}
      >
        {SUB_PLATAFORMAS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    )}

    {/* Separador visual */}
    <div className="h-5 w-px bg-slate-200" />

    {/* Desde */}
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-slate-500">Desde</span>
      <input
        type="date"
        value={filtros.desde ?? ""}
        onChange={(e) => onChange({ ...filtros, desde: e.target.value || undefined })}
        className={inputCls}
      />
    </div>

    {/* Hasta */}
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-slate-500">Hasta</span>
      <input
        type="date"
        value={filtros.hasta ?? ""}
        onChange={(e) => onChange({ ...filtros, hasta: e.target.value || undefined })}
        className={inputCls}
      />
    </div>

    {/* Limpiar */}
    {(filtros.desde || filtros.hasta) && (
      <button
        onClick={() => onChange({ ...filtros, desde: undefined, hasta: undefined })}
        className="text-[11px] text-slate-400 hover:text-slate-600 underline transition"
      >
        Limpiar
      </button>
    )}

  </div>
);
