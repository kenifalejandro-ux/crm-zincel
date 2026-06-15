/** client/src/components/finanzas/FiltrosFinanzas.tsx — NEON
 * Antes: select INPUT_BASE con focus:ring-brand. Ahora: neon-input + acento. Lógica INTACTA.
 */

import type { TabFinanzas } from "./TabsFinanzas";
import type { CategoriaEgreso, CategoriaPrestamo } from "../../types/finanzas.types";

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
      <select
        value={filtroCategoria}
        onChange={e => onCategoriaChange(e.target.value)}
        className="neon-input text-xs px-3 py-2"
      >
        <option value="">Todas las categorías</option>
        {categorias.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {filtroCategoria && (
        <button
          onClick={() => onCategoriaChange("")}
          className="text-xs text-zinc-500 hover:text-accent underline transition"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}