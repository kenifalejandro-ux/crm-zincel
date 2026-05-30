/**client/src/components/llamadas/LlamadaHistorial.tsx */

import { useEffect } from "react";
import { PhoneCall, PhoneMissed, Clock, Pencil, Trash2 } from "lucide-react";
import { useLlamadas } from "../../hooks/useLlamadas";
import { Badge } from "../ui/Badge";

const COLORES_RESULTADO: Record<string, "green" | "red" | "gray" | "yellow" | "orange" | "purple" | "pink"> = {
  interesado:          "green",
  solicita_informacion:"green",
  no_interesado:       "red",
  no_contesta:         "gray",
  volver_a_llamar:     "yellow",
  buzon_de_voz:        "orange",
  fuera_de_servicio:   "red",
  numero_equivocado:   "pink",
  ya_tiene_proveedor:  "purple",
  baja_de_oficio:      "red",
  suspension_temporal: "orange",
  perdida:             "red",
};

const LABELS: Record<string, string> = {
  interesado:          "Interesado",
  solicita_informacion:"Solicita información",
  no_interesado:       "No interesado",
  no_contesta:         "No contesta",
  volver_a_llamar:     "Volver a llamar",
  buzon_de_voz:        "Buzón de voz",
  fuera_de_servicio:   "Fuera de servicio",
  numero_equivocado:   "Número equivocado",
  ya_tiene_proveedor:  "Empresa con página web",
  baja_de_oficio:      "Baja de oficio",
  suspension_temporal: "Suspensión temporal",
  perdida:             "Venta perdida",
};

interface LlamadaHistorialProps {
  prospectoId: string;
  onEditar?:   (l: any) => void;
  onEliminar?: (id: string) => void;
  refetch?:    number;
}

export function LlamadaHistorial({ prospectoId, onEditar, onEliminar, refetch }: LlamadaHistorialProps) {
  const { llamadas, cargando, cargar } = useLlamadas(prospectoId);

  useEffect(() => { cargar(); }, [cargar, refetch]);

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
          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${l.contestada ? "bg-green-50 text-green-600" : "bg-gray-100 text-zinc-800"}`}>
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
              <span className="flex items-center gap-1 text-xs text-zinc-700">
                <Clock size={11} />
                {new Date(l.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                {l.hora_fin && <> – {l.hora_fin.slice(0, 5)}</>}
              </span>
            </div>
            {l.motivo_no_interes && (
              <p className="text-[11px] text-red-500 mt-0.5">
                Motivo: {
                  l.motivo_no_interes === "precio_alto"      ? "Precio alto"
                  : l.motivo_no_interes === "sin_presupuesto"  ? "Sin presupuesto"
                  : l.motivo_no_interes === "no_le_interesa"   ? "No le interesa el servicio"
                  : l.motivo_no_interes === "tiene_web"        ? "Empresa con página web"
                  : l.motivo_no_interes === "no_toma_decision" ? "No es quien decide"
                  : "Otro"
                }
              </p>
            )}
            {l.notas && <p className="text-xs text-zinc-800 mt-1 truncate">{l.notas}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-zinc-800 mr-1">
              {new Date(l.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
            </span>
            {onEditar && (
              <button onClick={() => onEditar(l)}
                className="text-zinc-400 hover:text-brand transition p-1" title="Editar">
                <Pencil size={13} />
              </button>
            )}
            {onEliminar && (
              <button onClick={() => onEliminar(l.id)}
                className="text-zinc-400 hover:text-red-500 transition p-1" title="Eliminar">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
