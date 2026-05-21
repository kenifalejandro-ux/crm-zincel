/**src/server/shared/utils/date.utils.ts */

export function formatearFecha(fecha: Date | string, formato: "corto" | "largo" | "hora" = "corto"): string {
  const d = new Date(fecha);

  if (formato === "corto") {
    return d.toLocaleDateString("es-PE", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
    });
  }

  if (formato === "largo") {
    return d.toLocaleDateString("es-PE", {
      weekday: "long",
      day:     "numeric",
      month:   "long",
      year:    "numeric",
    });
  }

  if (formato === "hora") {
    return d.toLocaleString("es-PE", {
      day:    "2-digit",
      month:  "2-digit",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });
  }

  return d.toISOString();
}

export function esHoy(fecha: Date | string): boolean {
  const d = new Date(fecha);
  const hoy = new Date();
  return (
    d.getDate()     === hoy.getDate() &&
    d.getMonth()    === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear()
  );
}

export function estaVencido(fecha: Date | string): boolean {
  return new Date(fecha) < new Date();
}

export function diasRestantes(fecha: Date | string): number {
  const diff = new Date(fecha).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function fechaHoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function inicioDelMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function finDelMes(): string {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
}