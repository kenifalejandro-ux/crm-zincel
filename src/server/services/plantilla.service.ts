/**src/server/services/plantilla.service.ts */

import { pool } from "../config/database";
import type { CrearPlantillaInput, ActualizarPlantillaInput } from "../schemas/plantilla.schema";

export async function obtenerPlantillasService(usuarioId: string) {
  const result = await pool.query(
    `SELECT id, titulo, canal, contenido, creado_en
     FROM plantillas_mensaje
     WHERE creado_por = $1
     ORDER BY creado_en DESC`,
    [usuarioId]
  );
  return result.rows;
}

export async function crearPlantillaService(input: CrearPlantillaInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO plantillas_mensaje (titulo, canal, contenido, creado_por)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [input.titulo, input.canal, input.contenido, usuarioId]
  );
  return result.rows[0];
}

export async function actualizarPlantillaService(id: string, input: ActualizarPlantillaInput) {
  const campos = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("Sin campos para actualizar");
  const sets   = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
  const valores = campos.map(c => (input as any)[c]);
  const result = await pool.query(
    `UPDATE plantillas_mensaje SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Plantilla no encontrada");
  return result.rows[0];
}

export async function eliminarPlantillaService(id: string) {
  const result = await pool.query(
    `DELETE FROM plantillas_mensaje WHERE id = $1 RETURNING id`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Plantilla no encontrada");
}
