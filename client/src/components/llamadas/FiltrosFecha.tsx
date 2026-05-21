/** client/src/components/llamadas/FiltrosFecha.tsx */

import { aniosDisponibles } from "../../utils/date";

interface Props {
  filtroPeriodo: string;
  filtroFecha: string;
  onPeriodoChange: (valor: string) => void;
  onFechaChange: (valor: string) => void;
  onAplicar: () => void;
}

export function FiltrosFecha({
  filtroPeriodo,
  filtroFecha,
  onPeriodoChange,
  onFechaChange,
  onAplicar,
}: Props) {
  const anios = aniosDisponibles();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 grid gap-4 md:grid-cols-[1fr_auto] items-end">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Selector de período */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Periodo</label>
          <select
            value={filtroPeriodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dia">Por día</option>
            <option value="semana">Por semana</option>
            <option value="mes">Por mes</option>
            <option value="anio">Por año</option>
          </select>
        </div>

        {/* Selector de fecha / año */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            {filtroPeriodo === "anio" ? "Seleccionar año" : "Seleccionar fecha"}
          </label>

          {filtroPeriodo === "anio" ? (
            <select
              value={filtroFecha}
              onChange={(e) => onFechaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {anios.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          ) : (
            <input
              type={filtroPeriodo === "mes" ? "month" : "date"}
              value={filtroFecha}
              onChange={(e) => onFechaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>

      <button
        onClick={onAplicar}
        className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        Aplicar filtro
      </button>
    </div>
  );
}