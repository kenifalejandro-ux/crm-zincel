/** client/src/components/llamadas/MotivosChart.tsx */

const LABELS: Record<string, string> = {
  precio_alto:       "Precio alto",
  ya_tiene_proveedor:"Ya tiene proveedor",
  sin_presupuesto:   "Sin presupuesto",
  no_le_interesa:    "No le interesa",
  tiene_web:         "Ya tiene web",
  no_toma_decision:  "No decide",
  otro:              "Otro",
};

const COLORES = [
  "bg-red-400", "bg-orange-400", "bg-yellow-400",
  "bg-purple-400", "bg-blue-400", "bg-pink-400", "bg-zinc-400",
];

interface Props {
  data: Array<{ motivo_perdida: string; total: number }>;
}

export function MotivosChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-800">¿Por qué no cierran?</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Motivos de pérdida registrados</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-xs text-zinc-400">
          Sin motivos registrados aún — márcalos al editar un prospecto perdido
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.map((d, i) => {
            const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
            return (
              <div key={d.motivo_perdida}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-600">{LABELS[d.motivo_perdida] ?? d.motivo_perdida}</span>
                  <span className="text-xs font-semibold text-zinc-700">{d.total} <span className="text-zinc-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${COLORES[i % COLORES.length]} transition-all`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-zinc-400 pt-1">{total} prospectos perdidos en total</p>
        </div>
      )}
    </div>
  );
}
