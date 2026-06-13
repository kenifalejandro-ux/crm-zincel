/** client/src/components/finanzas/FiltrosFinanzas.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import type { TabFinanzas } from "./TabsFinanzas";
import type { CategoriaEgreso, CategoriaPrestamo } from "../../types/finanzas.types";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const CATEGORIAS_EGRESO: { value: CategoriaEgreso; label: string }[] = [
  { value: "publicidad_digital",      label: "Publicidad digital"      },
  { value: "herramientas_saas",       label: "Herramientas & SaaS"     },
  { value: "herramientas_ia",         label: "Herramientas IA"         },
  { value: "infraestructura_digital", label: "Infraestructura digital" },
  { value: "subcontratos",            label: "Subcontratos"            },
];

const CATEGORIAS_PRESTAMO: { value: CategoriaPrestamo; label: string }[] = [
  { value: "herramientas_ia",         label: "Herramientas IA"         },
  { value: "infraestructura_digital", label: "Infraestructura digital" },
  { value: "publicidad_digital",      label: "Publicidad digital"      },
  { value: "herramientas_saas",       label: "Herramientas & SaaS"     },
  { value: "subcontratos",            label: "Subcontratos"            },
  { value: "personal",                label: "Personal"                },
  { value: "otro",                    label: "Otro"                    },
];

function generarMeses(cuantos = 18) {
  const opciones: { mes: number; anio: number; label: string }[] = [];
  const hoy = new Date();
  for (let i = 0; i < cuantos; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    opciones.push({
      mes:   d.getMonth() + 1,
      anio:  d.getFullYear(),
      label: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return opciones;
}

const OPCIONES_MES = generarMeses();

interface Props {
  tab:                TabFinanzas;
  filtroMes:          number;
  filtroAnio:         number;
  filtroCategoria:    string;
  onMesChange:        (mes: number, anio: number) => void;
  onCategoriaChange:  (cat: string) => void;
}

export function FiltrosFinanzas({
  tab, filtroCategoria, onCategoriaChange,
}: Props) {
  if (tab === "ingresos" || tab === "resumen") return null;

  const categorias = tab === "egresos" ? CATEGORIAS_EGRESO : CATEGORIAS_PRESTAMO;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtro por categoría */}
      <select
        value={filtroCategoria}
        onChange={e => onCategoriaChange(e.target.value)}
        className={`${INPUT_BASE} text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/50 text-zinc-400`}
      >
        <option value="">Todas las categorías</option>
        {categorias.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {filtroCategoria && (
        <button
          onClick={() => onCategoriaChange("")}
          className="text-xs text-zinc-400 hover:text-zinc-400 underline transition"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
