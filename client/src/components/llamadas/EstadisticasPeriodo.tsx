/** client/src/components/llamadas/EstadisticasPeriodo.tsx */

interface StatItem {
  fecha: string;
  total: number;
  contestadas: number;
  no_contestadas: number;
}

interface ResumenItem {
  canal: string;
  por_canal: number;
}

interface Props {
  estadisticas: StatItem[];
  resumen: ResumenItem[];
  filtroPeriodo: string;
  onPeriodoChange: (valor: string) => void;
}

export function EstadisticasPeriodo({
  estadisticas,
  resumen,
  filtroPeriodo,
  onPeriodoChange,
}: Props) {
  const labelPeriodo =
    filtroPeriodo === "dia" ? "día" : filtroPeriodo === "mes" ? "mes" : "semana";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Llamadas por período */}
      <div className="bg-slate-100 rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-zinc-800">
            Llamadas por {labelPeriodo}
          </h2>
          <select
            value={filtroPeriodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dia">Por día</option>
            <option value="semana">Por semana</option>
            <option value="mes">Por mes</option>
          </select>
        </div>

        {estadisticas.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin llamadas registradas</p>
        ) : (
          <div className="space-y-3">
            {estadisticas.slice(0, 12).map((stat, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-800">{stat.fecha}</p>
                  <p className="text-xs text-zinc-400">
                    {stat.contestadas} contestadas de {stat.total} totales
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-800">{stat.total}</p>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{
                        width: `${stat.total > 0 ? (stat.contestadas / stat.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {estadisticas.length > 12 && (
              <p className="text-xs text-zinc-400 text-center">
                Mostrando 12 de {estadisticas.length} períodos
              </p>
            )}
          </div>
        )}
      </div>

      {/* Llamadas por canal */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-xs font-semibold text-zinc-800 mb-4">Llamadas por canal</h2>
        {resumen.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">Sin registros aún</p>
        ) : (
          <div className="space-y-2">
            {resumen.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs text-gray-700 capitalize">{r.canal}</span>
                <span className="text-xs font-medium text-zinc-800">{r.por_canal} llamadas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}