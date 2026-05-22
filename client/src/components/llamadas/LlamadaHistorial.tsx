/**client/src/components/llamadas/LlamadaHistorial.tsx */

import { useEffect } from "react";
import { Phone, PhoneCall, PhoneMissed, Clock } from "lucide-react";
import { useLlamadas } from "../../hooks/useLlamadas";
import { Badge } from "../ui/Badge";

const COLORES_RESULTADO: Record<string, "green" | "red" | "gray" | "yellow" | "orange" | "purple" | "pink"> = {
  interesado:        "green",
  no_interesado:     "red",
  no_contesta:       "gray",
  volver_a_llamar:   "yellow",
  buzon_de_voz:      "orange",
  fuera_de_servicio: "red",
  numero_equivocado: "pink",
  ya_tiene_proveedor:"purple",
};

const LABELS: Record<string, string> = {
  interesado:        "Interesado",
  no_interesado:     "No interesado",
  no_contesta:       "No contesta",
  volver_a_llamar:   "Volver a llamar",
  buzon_de_voz:      "Buzón de voz",
  fuera_de_servicio: "Fuera de servicio",
  numero_equivocado: "Número equivocado",
  ya_tiene_proveedor:"Ya tiene proveedor",
};

interface LlamadaHistorialProps {
  prospectoId: string;
}

export function LlamadaHistorial({ prospectoId }: LlamadaHistorialProps) {
  const { llamadas, cargando, cargar } = useLlamadas(prospectoId);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (llamadas.length === 0) return (
    <p className="text-xs text-zinc-800 text-center py-6">Sin llamadas registradas</p>
  );

  return (
    <div className="space-y-2">
      {llamadas.map(l => (
        <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
          <div className={`mt-0.5 p-1.5 rounded-lg ${l.contestada ? "bg-green-50 text-green-600" : "bg-gray-100 text-zinc-800"}`}>
            {l.contestada ? <PhoneCall size={14} /> : <PhoneMissed size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-700 capitalize">{l.canal}</span>
              {l.resultado && (
                <Badge color={COLORES_RESULTADO[l.resultado] ?? "gray"}>
                  {LABELS[l.resultado] ?? l.resultado}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={11} />
                {new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                {l.hora_fin && <> – {l.hora_fin.slice(0, 5)}</>}
              </span>
            </div>
            {l.motivo_no_interes && (
              <p className="text-[11px] text-red-500 mt-0.5">
                Motivo: {
                  l.motivo_no_interes === "precio"             ? "💰 Precio muy alto"
                  : l.motivo_no_interes === "sin_presupuesto"  ? "📅 Sin presupuesto"
                  : l.motivo_no_interes === "ya_tiene_proveedor" ? "🔒 Ya tiene proveedor"
                  : l.motivo_no_interes === "no_necesita"      ? "🚫 No necesita el servicio"
                  : l.motivo_no_interes === "no_decide"        ? "👤 No es quien decide"
                  : l.motivo_no_interes === "mala_experiencia" ? "😞 Mala experiencia previa"
                  : "📝 Otro motivo"
                }
              </p>
            )}
            {l.notas && <p className="text-xs text-zinc-800 mt-1 truncate">{l.notas}</p>}
          </div>
          <span className="text-xs text-zinc-800 shrink-0">
            {new Date(l.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}