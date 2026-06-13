/** client/src/pages/ObjetivosPage.tsx */

import { useEffect, useState } from "react";
import { ObjetivoDiarioGauge }   from "../components/dashboard/ObjetivoDiarioGauge";
import { FiltroPeriodoBotones, type FiltroPeriodo } from "../components/shared/FiltroPeriodoBotones";
import { getResumenEstadosPropuestas } from "../services/propuestas.api";

function buildPropuestasParams(periodo: FiltroPeriodo, filtroFecha: string) {
  if (periodo === "mes") {
    const [anio, mes] = filtroFecha.split("-").map(Number);
    return { periodo: "mes", mes, anio };
  }
  if (periodo === "anio") return { periodo: "anio", anio: Number(filtroFecha) };
  if (periodo === "dia")  return { periodo: "dia",  fecha: filtroFecha };
  return { periodo };
}

export default function ObjetivosPage() {
  const hoy    = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  const [periodo,       setPeriodo]      = useState<FiltroPeriodo>("mes");
  const [filtroFecha,   setFiltroFecha]  = useState<string>(
    `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`
  );
  const [propuestasHoy, setPropuestasHoy] = useState(0);

  const mesSeleccionado = periodo === "mes"
    ? { mes: Number(filtroFecha.split("-")[1]) - 1, anio: Number(filtroFecha.split("-")[0]) }
    : { mes: hoy.getMonth(), anio: hoy.getFullYear() };

  const anioSeleccionado = periodo === "anio" ? Number(filtroFecha) : hoy.getFullYear();
  const diaSeleccionado  = periodo === "dia"  ? filtroFecha : hoyStr;

  useEffect(() => {
    const params = buildPropuestasParams(periodo, filtroFecha);
    getResumenEstadosPropuestas(params as any)
      .then(data => setPropuestasHoy(data.reduce((s, r) => s + r.total, 0)))
      .catch(console.error);
  }, [periodo, filtroFecha]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">Objetivos</h1>
          <p className="text-xs text-zinc-400 mt-1">Metas operativas diarias — llamadas, reuniones, brochures y propuestas</p>
        </div>
        <FiltroPeriodoBotones
          periodo={periodo}
          filtroFecha={filtroFecha}
          onChange={(p, f) => { setPeriodo(p); setFiltroFecha(f); }}
        />
      </div>

      <ObjetivoDiarioGauge
        filtroPeriodo={periodo}
        mesSeleccionado={mesSeleccionado}
        anioSeleccionado={anioSeleccionado}
        diaSeleccionado={diaSeleccionado}
        propuestasHoy={propuestasHoy}
      />
    </div>
  );
}
