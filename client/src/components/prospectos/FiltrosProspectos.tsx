/** client/src/components/prospectos/FiltrosProspectos.tsx */

import { Search } from "lucide-react";
import { ESTADOS_LEAD } from "../../utils/prospectos.mappers";

interface Props {
  busqueda: string;
  estadoFiltro: string;
  onBusqueda: (valor: string) => void;
  onEstado: (valor: string) => void;
}

export function FiltrosProspectos({ busqueda, estadoFiltro, onBusqueda, onEstado }: Props) {
  return (
    <div className="flex gap-3">
      {/* Buscador */}
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          placeholder="Buscar empresa, contacto, teléfono..."
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {/* Selector de estado */}
      <select
        value={estadoFiltro}
        onChange={(e) => onEstado(e.target.value)}
        className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 text-gray-600"
      >
        {ESTADOS_LEAD.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );
}

