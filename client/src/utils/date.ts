/** Retorna la fecha de hoy en formato YYYY-MM-DD en zona horaria local (evita el desfase UTC) */
export function fechaHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Calcula el rango de fechas ISO a partir de un valor de filtro y un período */
export function calcularRangoFecha(
  fecha: string,
  periodo: "dia" | "semana" | "mes" | "anio"
): { fecha_inicio?: string; fecha_fin?: string } {
  if (periodo === "anio") {
    const year = parseInt(fecha);
    if (!year) return {};
    return {
      fecha_inicio: `${year}-01-01T00:00:00.000Z`,
      fecha_fin:    `${year + 1}-01-01T00:00:00.000Z`,
    };
  }
  if (periodo === "mes") {
    const [year, month] = fecha.split("-").map(Number);
    if (!year || !month) return {};
    const inicio = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
    const finMes = month === 12
      ? `${year + 1}-01-01T00:00:00.000Z`
      : `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    return { fecha_inicio: inicio, fecha_fin: finMes };
  }
  if (!fecha) return {};
  const [y, m, d] = fecha.split("-").map(Number);
  if (periodo === "dia") {
    return {
      fecha_inicio: `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T00:00:00.000Z`,
      fecha_fin:    new Date(Date.UTC(y, m - 1, d + 1)).toISOString(),
    };
  }
  // semana
  const dia    = new Date(Date.UTC(y, m - 1, d));
  const ajuste = (dia.getUTCDay() + 6) % 7;
  const ini    = new Date(Date.UTC(y, m - 1, d - ajuste));
  const fin    = new Date(Date.UTC(y, m - 1, d - ajuste + 7));
  return { fecha_inicio: ini.toISOString(), fecha_fin: fin.toISOString() };
}

/** Años disponibles para el selector de año (desde 2023 hasta año actual + 1) */
export function aniosDisponibles(): number[] {
  const actual = new Date().getFullYear();
  return Array.from({ length: actual - 2022 }, (_, i) => 2023 + i);
}
