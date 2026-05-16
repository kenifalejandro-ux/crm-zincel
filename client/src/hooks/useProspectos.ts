/**client/src/hooks/useProspectos.ts*/

import { useState, useCallback } from "react";
import {
  getProspectos,
  crearProspecto,
  actualizarProspecto,
  eliminarProspecto,
  importarProspectos,
} from "../services/prospectos.api";

import type { Prospecto, FiltrosProspecto } from "../types/prospecto.types";

export function useProspectos() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [total, setTotal]           = useState(0);
  const [cargando, setCargando]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // 🔵 CARGAR
  const cargar = useCallback(async (filtros?: FiltrosProspecto) => {
    setCargando(true);
    setError(null);
    try {
      const result = await getProspectos(filtros);
      setProspectos(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar prospectos");
    } finally {
      setCargando(false);
    }
  }, []);

  // 🟢 CREAR
  const crear = useCallback(async (payload: Partial<Prospecto>) => {
    const nuevo = await crearProspecto(payload);
    setProspectos(prev => [nuevo, ...prev]);
    setTotal(prev => prev + 1);
    return nuevo;
  }, []);

  // 🟡 ACTUALIZAR
  const actualizar = useCallback(async (id: string, payload: Partial<Prospecto>) => {
    const actualizado = await actualizarProspecto(id, payload);
    setProspectos(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  }, []);

  // 🔴 ELIMINAR
  const eliminar = useCallback(async (id: string) => {
    await eliminarProspecto(id);
    setProspectos(prev => prev.filter(p => p.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  // 🚀 IMPORTAR (NUEVO)
  const importar = useCallback(async (data: any[]) => {
    setCargando(true);
    setError(null);
    try {
      const result = await importarProspectos(data);

      // recargar lista después de importar
      await cargar();

      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al importar prospectos");
      throw err;
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  return {
    prospectos,
    total,
    cargando,
    error,
    cargar,
    crear,
    actualizar,
    eliminar,
    importar, // 👈 IMPORTANTE
  };
}