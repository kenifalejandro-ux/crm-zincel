/**client/src/components/reuniones/ReunionCalendario.tsx*/

import { useState } from "react";
import { ChevronLeft, ChevronRight, Video, MapPin } from "lucide-react";
import type { Reunion } from "../../types/reunion.types";
import { Badge } from "../ui/Badge";

const COLOR_ESTADO: Record<string, "blue" | "green" | "red" | "yellow" | "purple"> = {
  programada:   "blue",
  realizada:    "green",
  cancelada:    "red",
  reprogramada: "yellow",
  en_proceso:   "purple",
};

interface ReunionCalendarioProps {
  reuniones: Reunion[];
}

export function ReunionCalendario({ reuniones }: ReunionCalendarioProps) {
  const hoy   = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primerDia  = new Date(anio, mes, 1).getDay();
  const diasEnMes  = new Date(anio, mes + 1, 0).getDate();
  const celdas     = Array.from({ length: Math.ceil((primerDia + diasEnMes) / 7) * 7 });

  const reunionesPorDia = (dia: number) =>
    reuniones.filter(r => {
      const f = new Date(r.fecha_hora);
      return f.getDate() === dia && f.getMonth() === mes && f.getFullYear() === anio;
    });

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  function navMes(dir: 1 | -1) {
    const d = new Date(anio, mes + dir, 1);
    setMes(d.getMonth());
    setAnio(d.getFullYear());
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-800">{MESES[mes]} {anio}</h3>
        <div className="flex gap-1">
          <button onClick={() => navMes(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-zinc-800 transition">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navMes(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-zinc-800 transition">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Días de semana */}
      <div className="grid grid-cols-7 text-center">
        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(d => (
          <div key={d} className="text-xs font-medium text-zinc-800 py-1">{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((_, i) => {
          const dia = i - primerDia + 1;
          const valido = dia >= 1 && dia <= diasEnMes;
          const esHoy  = valido && dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
          const eventos = valido ? reunionesPorDia(dia) : [];

          return (
            <div key={i} className={`min-h-[52px] rounded-lg p-1 text-xs
              ${!valido ? "" : esHoy ? "bg-brand/5 ring-1 ring-brand/30" : "hover:bg-gray-50"}`}>
              {valido && (
                <>
                  <span className={`block text-right mb-1 font-medium ${esHoy ? "text-brand" : "gray-100"}`}>
                    {dia}
                  </span>
                  {eventos.slice(0, 2).map(r => (
                    <div key={r.id} className="truncate text-[10px] bg-brand/15 text-zinc-800 rounded px-1 mb-0.5">
                      {new Date(r.fecha_hora).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} {r.titulo}
                    </div>
                  ))}
                  {eventos.length > 2 && (
                    <span className="text-[10px] text-zinc-800">+{eventos.length - 2} más</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Próximas reuniones del mes */}
      {reuniones.filter(r => {
        const f = new Date(r.fecha_hora);
        return f.getMonth() === mes && f.getFullYear() === anio;
      }).length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-800 uppercase tracking-wide">Este mes</p>
          {reuniones
            .filter(r => { const f = new Date(r.fecha_hora); return f.getMonth() === mes && f.getFullYear() === anio; })
            .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
            .map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                <div className="text-center shrink-0 w-8">
                  <p className="text-xs font-bold text-zinc-800">{new Date(r.fecha_hora).getDate()}</p>
                  <p className="text-[10px] text-zinc-800 uppercase">
                    {new Date(r.fecha_hora).toLocaleDateString("es-PE", { month: "short" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-800 truncate">{r.titulo}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {r.modalidad === "presencial" ? <MapPin size={10} className="text-zinc-800" /> : <Video size={10} className="text-zinc-800" />}
                    <span className="text-[10px] text-zinc-800 capitalize">{r.modalidad.replace("_", " ")}</span>
                  </div>
                </div>
                <Badge color={COLOR_ESTADO[r.estado] ?? "gray"}>{r.estado}</Badge>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}