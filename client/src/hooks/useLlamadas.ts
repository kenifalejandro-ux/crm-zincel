/**client/src/hooks/usellamadas.ts */

import { useState, useCallback } from "react";
import api from "../services/api";
import { getLlamadas, crearLlamada } from "../services/llamadas.api";
import type { Llamada, CrearLlamadaPayload } from "../types/llamada.types";

export function useLlamadas(prospecto_id?: string) {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Si hay prospecto_id, cargar llamadas de ese prospecto
      // Si no, intentar cargar todas las llamadas (asumiendo que existe la ruta)
      const url = prospecto_id ? `/llamadas/${prospecto_id}` : '/llamadas';
      const { data } = await api.get(url);
      setLlamadas(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar llamadas");
    } finally {
      setCargando(false);
    }
  }, [prospecto_id]);

  const registrar = useCallback(async (payload: CrearLlamadaPayload) => {
    const nueva = await crearLlamada(payload);
    setLlamadas(prev => [nueva, ...prev]);
    return nueva;
  }, []);

  return { llamadas, cargando, error, cargar, registrar };
}