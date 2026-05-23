/** client/src/components/inteligencia/LeadScatterChart.tsx */

import { useEffect, useState } from "react";
import { COLORS, CARD_CLASS, HEADER_CLASS } from "../../lib/tokens";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ZAxis, ReferenceLine,
} from "recharts";
import { Target } from "lucide-react";
import { getScoresLeads } from "../../services/prospectos.api";
import type { ScoreLead } from "../../services/prospectos.api";

const NIVEL_COLOR: Record<string, string> = {
  caliente: COLORS.primary,
  activo:   COLORS.dark,
  tibio:    COLORS.mutedDark,
  frio:     COLORS.danger,
};

const NIVEL_LABEL: Record<string, string> = {
  caliente: "Caliente",
  activo:   "Activo",
  tibio:    "Tibio",
  frio:     "Frío",
};

const ETAPA_LABEL: Record<string, string> = {
  nuevo:             "Nuevo",
  contactado:        "Contactado",
  interesado:        "Interesado",
  propuesta_enviada: "Propuesta",
  negociacion:       "Negociación",
  cerrado_ganado:    "Cerrado",
  perdido:           "Perdido",
};

const TooltipScatter = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: ScoreLead = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm px-3 py-2 text-xs max-w-[180px]">
      <p className="font-semibold text-zinc-800 truncate mb-1">{d.empresa}</p>
      <div className="space-y-0.5 text-zinc-600">
        <p>Score: <span className="font-bold text-zinc-900">{d.score}</span></p>
        <p>Días en pipeline: <span className="font-bold text-zinc-900">{d.dias_en_pipeline}</span></p>
        <p>Etapa: <span className="font-medium">{ETAPA_LABEL[d.etapa_pipeline] ?? d.etapa_pipeline}</span></p>
        <p>
          Nivel:{" "}
          <span className="font-bold" style={{ color: NIVEL_COLOR[d.nivel] }}>
            {NIVEL_LABEL[d.nivel] ?? d.nivel}
          </span>
        </p>
      </div>
    </div>
  );
};

const NIVELES = ["caliente", "activo", "tibio", "frio"] as const;

export function LeadScatterChart() {
  const [leads, setLeads]       = useState<ScoreLead[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getScoresLeads()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className={`${CARD_CLASS} flex items-center justify-center h-48`}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
      </div>
    );
  }

  if (!leads.length) return null;

  const byNivel = NIVELES.reduce<Record<string, ScoreLead[]>>((acc, n) => {
    acc[n] = leads.filter(l => l.nivel === n);
    return acc;
  }, {});

  const maxDias = Math.max(...leads.map(l => l.dias_en_pipeline), 30);

  return (
    <div className={CARD_CLASS}>
      <h3 className={HEADER_CLASS}>
        <Target size={14} className="mr-2.5 text-rose-500" strokeWidth={2} />
        Score de leads vs. tiempo en pipeline
      </h3>
      <p className="text-[11px] text-zinc-500 mb-4 -mt-3">
        Leads calientes arriba a la derecha → prioridad inmediata · arriba a la izquierda → requieren más trabajo
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.surface} />
          <XAxis
            type="number"
            dataKey="score"
            name="Score"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Score", position: "insideBottom", offset: -2, fontSize: 10, fill: COLORS.muted }}
          />
          <YAxis
            type="number"
            dataKey="dias_en_pipeline"
            name="Días"
            domain={[0, maxDias + 5]}
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Días", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: COLORS.muted }}
          />
          <ZAxis range={[40, 40]} />
          {/* Cuadrantes: score 50, días = mediana */}
          <ReferenceLine x={50} stroke="#f4f4f5" strokeDasharray="4 3" strokeWidth={1} />
          <ReferenceLine y={Math.round(maxDias / 2)} stroke="#f4f4f5" strokeDasharray="4 3" strokeWidth={1} />
          <Tooltip content={<TooltipScatter />} cursor={{ strokeDasharray: "3 3" }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(value) => NIVEL_LABEL[value] ?? value}
          />
          {NIVELES.map(nivel => (
            byNivel[nivel].length > 0 && (
              <Scatter
                key={nivel}
                name={nivel}
                data={byNivel[nivel]}
                fill={NIVEL_COLOR[nivel]}
                fillOpacity={0.8}
              />
            )
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Mini resumen por nivel */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-zinc-100">
        {NIVELES.map(n => (
          <div key={n} className="text-center">
            <p className="text-lg font-bold" style={{ color: NIVEL_COLOR[n] }}>
              {byNivel[n].length}
            </p>
            <p className="text-[10px] text-zinc-500">{NIVEL_LABEL[n]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
