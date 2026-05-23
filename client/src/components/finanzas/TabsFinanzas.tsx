/** client/src/components/finanzas/TabsFinanzas.tsx */

export type TabFinanzas = "ingresos" | "egresos" | "prestamos" | "resumen";

interface Props {
  tab: TabFinanzas;
  onChange: (tab: TabFinanzas) => void;
}

const TABS: { value: TabFinanzas; label: string }[] = [
  { value: "ingresos",  label: "Ingresos"   },
  { value: "egresos",   label: "Egresos"    },
  { value: "prestamos", label: "Préstamos"  },
  { value: "resumen",   label: "Resumen"    },
];

export function TabsFinanzas({ tab, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
      {TABS.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-4 py-1.5 text-xs rounded-md transition ${
            tab === t.value
              ? "bg-white shadow-sm text-zinc-800 font-medium"
              : "text-zinc-700 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
