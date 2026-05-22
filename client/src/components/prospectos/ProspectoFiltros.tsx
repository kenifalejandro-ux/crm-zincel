/**client/src/prospectos/ProspectoFiltros.tsx */
import { Search } from "lucide-react";

interface ProspectoFiltrosProps {
  busqueda: string;
  estadoFiltro: string;
  onBusquedaChange: (value: string) => void;
  onEstadoFiltroChange: (value: string) => void;
}

const ESTADOS_LEAD = [
  { value: "", label: "Todos los estados" },
  { value: "interesado", label: "Interesado" },
  { value: "no_interesado", label: "No interesado" },
  { value: "no_contesta", label: "No contesta" },
  { value: "volver_a_llamar", label: "Volver a llamar" },
  { value: "buzon_de_voz", label: "Buzón de voz" },
  { value: "fuera_de_servicio", label: "Fuera de servicio" },
  { value: "numero_equivocado", label: "Número equivocado" },
  { value: "ya_tiene_proveedor", label: "Ya tiene proveedor" },
];

export function ProspectoFiltros({ busqueda, estadoFiltro, onBusquedaChange, onEstadoFiltroChange }: ProspectoFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-800" />
        <input
          type="text"
          value={busqueda}
          onChange={e => onBusquedaChange(e.target.value)}
          placeholder="Buscar empresa, contacto, teléfono..."
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="min-w-[220px]">
          <label className="block text-xs font-medium gray-100 mb-1">Estado</label>
          <select
            value={estadoFiltro}
            onChange={e => onEstadoFiltroChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 gray-100"
          >
            {ESTADOS_LEAD.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
