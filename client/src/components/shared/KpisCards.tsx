/** client/src/components/shared/KpisCards.tsx */

import { CARD_CLASS } from "../../lib/tokens";
import type { ReactNode } from "react";


export interface KpiItem {
  label: string;
  valor: string | number;
  icon: ReactNode;
  color: string;
  bg: string;
}

interface Props {
  items: KpiItem[];
  cols?: 2 | 3 | 4;
}

export function KpiCards({ items, cols = 3 }: Props) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[cols];

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {items.map((k, i) => (
        <div key={i} className={CARD_CLASS}>
          <div className={`inline-flex p-2 rounded-lg ${k.bg} ${k.color} mb-3`}>
            {k.icon}
          </div>
          <p className="text-xl lg:text-2xl font-semibold text-zinc-800">{k.valor}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{k.label}</p>
        </div>
      ))}
    </div>
  );
}
