/** client/src/components/brochures/ResumenCanales.tsx */

const CANALES = ["correo", "whatsapp", "linkedin", "instagram", "facebook"];

const COLOR_CANAL: Record<string, string> = {
  correo:    "bg-blue-100 text-blue-700",
  whatsapp:  "bg-green-100 text-green-700",
  linkedin:  "bg-amber-100 text-amber-700",
  instagram: "bg-pink-100 text-pink-700",
  facebook:  "bg-purple-100 text-purple-700",
};

interface Props {
  resumen: any[];
}

export function ResumenCanales({ resumen }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {CANALES.map((canal) => {
        const dato = resumen.find((r) => r.canal === canal);
        return (
          <div key={canal} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${COLOR_CANAL[canal]}`}>
              {canal}
            </span>
            <p className="text-2xl font-semibold text-zinc-800">{dato?.total || 0}</p>
            <p className="text-xs text-zinc-400 mt-0.5">este mes: {dato?.este_mes || 0}</p>
          </div>
        );
      })}
    </div>
  );
}

export { CANALES, COLOR_CANAL };