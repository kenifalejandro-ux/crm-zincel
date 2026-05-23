/** client/src/components/brochures/ResumenCanales.tsx */

import { CARD_CLASS } from "../../lib/tokens";

const CANALES = ["correo", "whatsapp", "linkedin", "instagram", "facebook"];

interface Props {
  resumen: any[];
}

export function ResumenCanales({ resumen }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {CANALES.map((canal) => {
        const dato = resumen.find((r) => r.canal === canal);
        return (
          <div key={canal} className={`${CARD_CLASS} text-center`}>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize mb-2 bg-zinc-100 text-zinc-600">
              {canal}
            </span>
            <p className="text-2xl font-semibold text-zinc-800">{dato?.total || 0}</p>
            <p className="text-xs text-zinc-600 mt-0.5">este mes: {dato?.este_mes || 0}</p>
          </div>
        );
      })}
    </div>
  );
}

export const COLOR_CANAL: Record<string, string> = {
  correo:    "bg-zinc-100 text-zinc-700",
  whatsapp:  "bg-zinc-100 text-zinc-700",
  linkedin:  "bg-zinc-100 text-zinc-700",
  instagram: "bg-zinc-100 text-zinc-700",
  facebook:  "bg-zinc-100 text-zinc-700",
};

export { CANALES };
