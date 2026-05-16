/** src/hooks/useMetricas.ts */

import { useState, useCallback } from "react";
import {
  getMetricas, createMetrica, deleteMetrica,
  getResumenPorEmpresa,
} from "../services/metricas.api";
import { Metrica, ResumenPlataforma, FiltrosMetrica, FormMetrica } from "../types/metricas.types";

export const useMetricas = () => {
// ✅ Debe ser así — array vacío obligatorio:
const [metricas,  setMetricas]  = useState<Metrica[]>([]);
const [resumen,   setResumen]   = useState<ResumenPlataforma[]>([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const cargarMetricas = useCallback(async (filtros?: FiltrosMetrica) => {
    setCargando(true);
    try {
      const data = await getMetricas(filtros);
      setMetricas(data);
    } catch (e) {
      setError("Error al cargar métricas");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarResumen = useCallback(async (empresa: string) => {
    try {
      const data = await getResumenPorEmpresa(empresa);
      setResumen(data);
    } catch (e) {
      setError("Error al cargar resumen");
    }
  }, []);

  const agregarMetrica = useCallback(async (form: FormMetrica) => {
    const nueva = await createMetrica(form);
    setMetricas((prev) => [nueva, ...prev]);
    return nueva;
  }, []);

  const borrarMetrica = useCallback(async (id: string) => {
    await deleteMetrica(id);
    setMetricas((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    metricas, resumen, cargando, error,
    cargarMetricas, cargarResumen,
    agregarMetrica, borrarMetrica,
  };
};