/** Retorna la fecha de hoy en formato YYYY-MM-DD en zona horaria local (evita el desfase UTC) */
export function fechaHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
