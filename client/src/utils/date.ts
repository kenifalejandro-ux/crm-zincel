/** Construye un ISO string con el offset local para evitar desfase UTC al guardar en BD */
export function toLocalISOString(fecha: string, hora: string): string {
  const offset = new Date().getTimezoneOffset(); // minutos detrás de UTC (p.ej. 300 para UTC-5)
  const sign = offset <= 0 ? "+" : "-";
  const abs  = Math.abs(offset);
  const hh   = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm   = String(abs % 60).padStart(2, "0");
  return `${fecha}T${hora}:00${sign}${hh}:${mm}`;
}

/** Retorna la fecha de hoy en formato YYYY-MM-DD en zona horaria local (evita el desfase UTC) */
export function fechaHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Calcula el rango de fechas ISO a partir de un valor de filtro y un período.
 *  Usa medianoche local (no UTC) para que reuniones/llamadas a última hora del día
 *  queden dentro del rango correcto independientemente del offset del servidor.
 */
export function calcularRangoFecha(
  fecha: string,
  periodo: "hoy" | "dia" | "semana" | "mes" | "anio"
): { fecha_inicio?: string; fecha_fin?: string } {
  if (periodo === "hoy") {
    const d = new Date();
    const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const fin    = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return { fecha_inicio: inicio.toISOString(), fecha_fin: fin.toISOString() };
  }
  if (periodo === "anio") {
    const year = parseInt(fecha);
    if (!year) return {};
    return {
      fecha_inicio: new Date(year,     0, 1, 0, 0, 0, 0).toISOString(),
      fecha_fin:    new Date(year + 1, 0, 1, 0, 0, 0, 0).toISOString(),
    };
  }
  if (periodo === "mes") {
    const [year, month] = fecha.split("-").map(Number);
    if (!year || !month) return {};
    return {
      fecha_inicio: new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString(),
      fecha_fin:    new Date(year, month,     1, 0, 0, 0, 0).toISOString(),
    };
  }
  if (!fecha) return {};
  const [y, m, d] = fecha.split("-").map(Number);
  if (periodo === "dia") {
    return {
      fecha_inicio: new Date(y, m - 1, d,     0, 0, 0, 0).toISOString(),
      fecha_fin:    new Date(y, m - 1, d + 1, 0, 0, 0, 0).toISOString(),
    };
  }
  // semana — lunes como primer día
  const dia    = new Date(y, m - 1, d);
  const ajuste = (dia.getDay() + 6) % 7;
  const ini    = new Date(y, m - 1, d - ajuste,     0, 0, 0, 0);
  const fin    = new Date(y, m - 1, d - ajuste + 7, 0, 0, 0, 0);
  return { fecha_inicio: ini.toISOString(), fecha_fin: fin.toISOString() };
}

/** Años disponibles para el selector de año (desde 2023 hasta año actual + 1) */
export function aniosDisponibles(): number[] {
  const actual = new Date().getFullYear();
  return Array.from({ length: actual - 2022 }, (_, i) => 2023 + i);
}
