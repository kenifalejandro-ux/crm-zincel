/** src/components/metricas/FiltrosMetricas.tsx */

import { FiltrosMetrica, Plataforma, SubPlataforma } from "../../types/metricas.types";

interface Props {
  filtros:   FiltrosMetrica;
  empresas:  string[];
  proyectos: string[];
  onChange:  (f: FiltrosMetrica) => void;
}

const PLATAFORMAS = [
  { value: "",       label: "Todas las plataformas" },
  { value: "meta",   label: "Meta Ads"   },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
];

const SUB_PLATAFORMAS = [
  { value: "",                  label: "Facebook + Instagram" },
  { value: "facebook",          label: "Facebook"             },
  { value: "instagram",         label: "Instagram"            },
  { value: "audience_network",  label: "Audience Network"     },
];

const inputCls = "text-xs border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand/50";

export const FiltrosMetricas = ({ filtros, empresas, proyectos, onChange }: Props) => (
  <div className="flex flex-wrap gap-3 items-center">

    {/* Empresa */}
    <select
      value={filtros.empresa ?? ""}
      onChange={(e) => onChange({ ...filtros, empresa: e.target.value || undefined, proyecto: undefined })}
      className={inputCls}
    >
      <option value="">Todas las empresas</option>
      {empresas.map((emp) => (
        <option key={emp} value={emp}>{emp}</option>
      ))}
    </select>

    {/* Proyecto — visible solo si hay empresa seleccionada y hay proyectos */}
    {filtros.empresa && (
      <select
        value={filtros.proyecto ?? ""}
        onChange={(e) => onChange({ ...filtros, proyecto: e.target.value || undefined })}
        className={`${inputCls} ${filtros.proyecto ? "border-violet-400 text-violet-700 font-medium" : ""}`}
      >
        <option value="">Todos los proyectos</option>
        {proyectos.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="__sin_proyecto__" disabled className="text-zinc-300">— Sin asignar —</option>
      </select>
    )}

    {/* Plataforma */}
    <select
      value={filtros.plataforma ?? ""}
      onChange={(e) => onChange({
        ...filtros,
        plataforma:     e.target.value as Plataforma | "",
        sub_plataforma: "",
      })}
      className={inputCls}
    >
      {PLATAFORMAS.map((p) => (
        <option key={p.value} value={p.value}>{p.label}</option>
      ))}
    </select>

    {/* Sub plataforma — solo si es Meta */}
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
    <div className="h-6 w-px bg-zinc-200" />

    {/* Desde */}
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-600">Desde</span>
      <input
        type="date"
        value={filtros.desde ?? ""}
        onChange={(e) => onChange({ ...filtros, desde: e.target.value || undefined })}
        className={inputCls}
      />
    </div>

    {/* Hasta */}
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-600">Hasta</span>
      <input
        type="date"
        value={filtros.hasta ?? ""}
        onChange={(e) => onChange({ ...filtros, hasta: e.target.value || undefined })}
        className={inputCls}
      />
    </div>

    {/* Limpiar */}
    {(filtros.desde || filtros.hasta || filtros.proyecto) && (
      <button
        onClick={() => onChange({ ...filtros, desde: undefined, hasta: undefined, proyecto: undefined })}
        className="text-xs text-zinc-500 hover:text-zinc-700 underline"
      >
        Limpiar filtros
      </button>
    )}

  </div>
);
