/**src/server/shared/utils/pdf.utils.ts */

import { logger } from "../../config/logger";

export interface OpcionesPDF {
  titulo:     string;
  subtitulo?: string;
  datos:      Record<string, any>[];
  columnas:   { key: string; label: string }[];
}

export function generarHTMLParaPDF(opciones: OpcionesPDF): string {
  const { titulo, subtitulo, datos, columnas } = opciones;

  const filas = datos.map(fila =>
    `<tr>${columnas.map(col =>
      `<td>${fila[col.key] ?? "-"}</td>`
    ).join("")}</tr>`
  ).join("");

  const encabezados = columnas.map(col =>
    `<th>${col.label}</th>`
  ).join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        h1   { font-size: 18px; margin-bottom: 4px; }
        h2   { font-size: 13px; color: #666; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #1e3a5f; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .fecha { font-size: 10px; color: #999; margin-top: 4px; }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      ${subtitulo ? `<h2>${subtitulo}</h2>` : ""}
      <p class="fecha">Generado el ${new Date().toLocaleString("es-PE")}</p>
      <table>
        <thead><tr>${encabezados}</tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </body>
    </html>
  `;
}

export function exportarCSV(datos: Record<string, any>[], columnas: { key: string; label: string }[]): string {
  try {
    const encabezados = columnas.map(c => `"${c.label}"`).join(",");
    const filas = datos.map(fila =>
      columnas.map(col => {
        const valor = fila[col.key] ?? "";
        return `"${String(valor).replace(/"/g, '""')}"`;
      }).join(",")
    );
    return [encabezados, ...filas].join("\n");
  } catch (err) {
    logger.error({ err }, "Error al generar CSV");
    throw new Error("No se pudo generar el CSV");
  }
}