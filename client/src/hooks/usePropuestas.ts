/** client/src/hooks/usePropuestas.ts */

import { useState, useCallback } from "react";
import {
  getPropuestas,
  crearPropuesta,
  actualizarPropuesta,
  eliminarPropuesta,
} from "../services/propuestas.api";
import type { Propuesta } from "../types/propuesta.types";

export function usePropuestas(prospecto_id: string) {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [cargando,   setCargando]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const cargarPropuestas = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getPropuestas(prospecto_id);
      setPropuestas(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al cargar propuestas");
    } finally {
      setCargando(false);
    }
  }, [prospecto_id]);

  const agregarPropuesta = useCallback(async (
    payload: Parameters<typeof crearPropuesta>[0]
  ) => {
    const nueva = await crearPropuesta(payload);
    setPropuestas((prev) => [nueva, ...prev]);
    return nueva;
  }, []);

  const editarPropuesta = useCallback(async (
    id: string,
    payload: Parameters<typeof actualizarPropuesta>[1]
  ) => {
    const actualizada = await actualizarPropuesta(id, payload);
    setPropuestas((prev) => prev.map((p) => p.id === id ? actualizada : p));
    return actualizada;
  }, []);

  const borrarPropuesta = useCallback(async (id: string) => {
    await eliminarPropuesta(id);
    setPropuestas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    propuestas,
    cargando,
    error,
    cargarPropuestas,
    agregarPropuesta,
    editarPropuesta,
    borrarPropuesta,
  };
}
