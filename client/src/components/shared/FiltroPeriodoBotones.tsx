/** client/src/components/shared/FiltroPeriodoBotones.tsx
 *
 *  Barra de filtro Hoy / Semana / Mes / Año / Día
 *  Replica exacta del filtro del Dashboard, reutilizable en todas las páginas.
 */
import { useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export type FiltroPeriodo = "hoy" | "semana" | "mes" | "anio" | "dia";

interface Props {
  /** Período activo actualmente */
  periodo: FiltroPeriodo;
  /** Fecha seleccionada: YYYY-MM-DD (hoy/semana/dia), YYYY-MM (mes), YYYY (anio) */
  filtroFecha: string;
  /** Callback disparado inmediatamente al cambiar cualquier selección */
  onChange: (periodo: FiltroPeriodo, filtroFecha: string) => void;
}

const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESES_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

function hoyStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function generarCeldasMes(mes: number, anio: number): (number | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const ajuste    = (primerDia + 6) % 7;
  const celdas: (number | null)[] = Array(ajuste).fill(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  return celdas;
}

function formatDiaBtn(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES_CORTO[m - 1]} ${y}`;
}

export function FiltroPeriodoBotones({ periodo, filtroFecha, onChange }: Props) {
  const hoy = new Date();
  const todayStr = hoyStr();

  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [calAbierto,    setCalAbierto]    = useState(false);
  const [anioNavegando, setAnioNavegando] = useState(() => {
    if (periodo === "mes") {
      const [y] = filtroFecha.split("-").map(Number);
      return y || hoy.getFullYear();
    }
    return hoy.getFullYear();
  });
  const [calNav, setCalNav] = useState(() => {
    if (periodo === "dia" && filtroFecha.length === 10) {
      const [y, m] = filtroFecha.split("-").map(Number);
      return { mes: m - 1, anio: y };
    }
    return { mes: hoy.getMonth(), anio: hoy.getFullYear() };
  });

  const mesActual = periodo === "mes"
    ? { mes: Number(filtroFecha.split("-")[1]) - 1, anio: Number(filtroFecha.split("-")[0]) }
    : null;

  const btnClass = (activo: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-medium transition-all ${
      activo
        ? "bg-zinc-900 text-white shadow-sm"
        : "bg-white border border-gray-200 text-zinc-700 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-wrap gap-2 items-center relative">

      {/* Hoy */}
      <button
        onClick={() => { onChange("hoy", todayStr); setPickerAbierto(false); setCalAbierto(false); }}
        className={btnClass(periodo === "hoy")}
      >
        Hoy
      </button>

      {/* Semana */}
      <button
        onClick={() => { onChange("semana", todayStr); setPickerAbierto(false); setCalAbierto(false); }}
        className={btnClass(periodo === "semana")}
      >
        Semana
      </button>

      {/* Mes — picker */}
      <div className="relative">
        <button
          onClick={() => {
            setPickerAbierto(v => !v);
            setCalAbierto(false);
            if (periodo !== "mes") {
              const m  = hoy.getMonth();
              const y  = hoy.getFullYear();
              setAnioNavegando(y);
              onChange("mes", `${y}-${String(m + 1).padStart(2,"0")}`);
            }
          }}
          className={`flex items-center gap-1 ${btnClass(periodo === "mes")}`}
        >
          <Calendar size={12} />
          {periodo === "mes" && mesActual
            ? `${MESES_CORTO[mesActual.mes]} ${mesActual.anio}`
            : "Mes"}
          <ChevronDown size={12} />
        </button>

        {pickerAbierto && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-56">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setAnioNavegando(y => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-zinc-800">{anioNavegando}</span>
              <button
                onClick={() => setAnioNavegando(y => y + 1)}
                disabled={anioNavegando >= hoy.getFullYear()}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {MESES_CORTO.map((m, i) => {
                const esFuturo = anioNavegando === hoy.getFullYear() && i > hoy.getMonth();
                const esActual = mesActual && mesActual.mes === i && mesActual.anio === anioNavegando;
                return (
                  <button
                    key={m}
                    disabled={esFuturo}
                    onClick={() => {
                      onChange("mes", `${anioNavegando}-${String(i + 1).padStart(2,"0")}`);
                      setPickerAbierto(false);
                    }}
                    className={`py-1.5 text-xs rounded-lg transition capitalize ${
                      esActual  ? "bg-zinc-900 text-white font-semibold" :
                      esFuturo  ? "text-zinc-300 cursor-not-allowed"  :
                                  "text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Año */}
      <button
        onClick={() => {
          onChange("anio", String(hoy.getFullYear()));
          setPickerAbierto(false);
          setCalAbierto(false);
        }}
        className={btnClass(periodo === "anio")}
      >
        Año
      </button>

      {/* Día — calendario */}
      <div className="relative">
        <button
          onClick={() => {
            setCalAbierto(c => !c);
            setPickerAbierto(false);
            if (periodo !== "dia") onChange("dia", todayStr);
          }}
          className={`flex items-center gap-1 ${btnClass(periodo === "dia")}`}
        >
          <Calendar size={12} />
          {periodo === "dia" ? formatDiaBtn(filtroFecha) : "Día"}
          <ChevronDown size={12} />
        </button>

        {calAbierto && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalNav(n => {
                  const d = new Date(n.anio, n.mes - 1, 1);
                  return { mes: d.getMonth(), anio: d.getFullYear() };
                })}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-zinc-800">
                {MESES_FULL[calNav.mes]} {calNav.anio}
              </span>
              <button
                onClick={() => setCalNav(n => {
                  const d = new Date(n.anio, n.mes + 1, 1);
                  return { mes: d.getMonth(), anio: d.getFullYear() };
                })}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {generarCeldasMes(calNav.mes, calNav.anio).map((dia, i) => {
                if (!dia) return <div key={i} />;
                const fechaStr  = `${calNav.anio}-${String(calNav.mes + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
                const esHoy     = fechaStr === todayStr;
                const seleccionado = fechaStr === filtroFecha && periodo === "dia";
                return (
                  <button key={i}
                    onClick={() => { onChange("dia", fechaStr); setCalAbierto(false); }}
                    className={`
                      w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                      ${seleccionado ? "bg-zinc-900 text-white"         :
                        esHoy        ? "border-2 border-zinc-900 text-zinc-900" :
                                       "text-zinc-700 hover:bg-zinc-900/5"}
                    `}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { onChange("dia", todayStr); setCalAbierto(false); }}
              className="mt-3 w-full py-1.5 text-xs text-zinc-900 border border-zinc-900/20 rounded-lg hover:bg-zinc-900/5 transition"
            >
              Ir a hoy
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
