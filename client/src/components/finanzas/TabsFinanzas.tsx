/** client/src/components/finanzas/TabsFinanzas.tsx */

export type TabFinanzas = "ingresos" | "egresos" | "prestamos" | "resumen" | "empresas";

interface Props {
  tab: TabFinanzas;
  onChange: (tab: TabFinanzas) => void;
}

const TABS: { value: TabFinanzas; label: string }[] = [
  { value: "ingresos",  label: "Ingresos"   },
  { value: "egresos",   label: "Egresos"    },
  { value: "prestamos", label: "Préstamos"  },
  { value: "resumen",   label: "Resumen"    },
  { value: "empresas",  label: "Empresas"   },
];

export function TabsFinanzas({ tab, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-2 text-xs rounded-lg transition font-medium ${
            tab === t.value
              ? "bg-white shadow-sm text-amber-700 font-semibold"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
