/** src/components/metricas/detalle/ProyeccionDetalle.tsx */

import { PANEL_BASE } from "../../../lib/tokens";
import { ProyeccionData } from "../../../utils/metricas.calc";
import { Metrica }        from "../../../types/metricas.types";

interface Props {
  metrica:    Metrica;
  proyeccion: ProyeccionData;
}

interface FilaProps {
  label:  string;
  actual: string;
  proyectado: string;
  color?: string;
}

const Fila = ({ label, actual, proyectado, color = "text-zinc-800" }: FilaProps) => (
  <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-white/8 last:border-0">
    <span className="text-xs text-zinc-300">{label}</span>
    <span className="text-xs font-semibold text-zinc-300 text-center">{actual}</span>
    <span className={`text-xs font-bold text-right ${color}`}>{proyectado}</span>
  </div>
);

export const ProyeccionDetalle = ({ metrica: m, proyeccion: p }: Props) => (
  <div className="space-y-5">

    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
      <p className="text-xs font-semibold text-blue-700 mb-1">
        📈 Proyección a {p.dias} días
      </p>
      <p className="text-xs text-blue-500">
        Basado en el rendimiento diario promedio de esta campaña.
        Úsalo como referencia para planificar el presupuesto del siguiente mes.
      </p>
    </div>

    {/* Tabla comparativa */}
    <div className={`${PANEL_BASE} p-4`}>

      {/* Header tabla */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/10 mb-1">
        <span className="text-[10px] font-semibold text-zinc-100 uppercase">Métrica</span>
        <span className="text-[10px] font-semibold text-zinc-100 uppercase text-center">Actual</span>
        <span className="text-[10px] font-semibold text-zinc-100 uppercase text-right">
          Proyectado 30d
        </span>
      </div>

      <Fila
        label="Gasto"
        actual={`S/ ${Number(m.gasto).toLocaleString("es-PE")}`}
        proyectado={`S/ ${p.gasto_proyectado.toLocaleString("es-PE")}`}
        color="text-amber-600"
      />
      <Fila
        label="Leads"
        actual={String(m.leads)}
        proyectado={String(p.leads_proyectados)}
        color="text-blue-600"
      />
      <Fila
        label="Ingresos"
        actual={`S/ ${Number(m.ingresos).toLocaleString("es-PE")}`}
        proyectado={`S/ ${p.ingresos_proyectados.toLocaleString("es-PE")}`}
        color="text-green-600"
      />
      <Fila
        label="ROAS"
        actual={`${m.roas}x`}
        proyectado={`${p.roas_proyectado}x`}
        color={p.roas_proyectado >= 2 ? "text-green-600" : "text-red-600"}
      />
    </div>

    {/* Presupuesto recomendado */}
    <div className={`${PANEL_BASE} p-4 space-y-3`}>
      <p className="text-xs font-semibold text-zinc-300">
        💡 Presupuesto recomendado para escalar
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-black text-zinc-200">
            S/ {p.presupuesto_meta.toLocaleString("es-PE")}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            +20% sobre el gasto proyectado para escalar manteniendo el ROAS
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-300">ROAS esperado</p>
          <p className={`text-xl font-bold ${p.roas_proyectado >= 2 ? "text-green-600" : "text-red-600"}`}>
            {p.roas_proyectado}x
          </p>
        </div>
      </div>
    </div>

    {/* Aviso sin ingresos */}
    {m.ingresos === 0 && (
      <p className="text-xs text-zinc-400 text-center">
        💡 Registra los ingresos de la campaña para obtener una proyección de ROAS más precisa.
      </p>
    )}

  </div>
);