/** client/src/hooks/useFinanzas.ts */

import { useState, useCallback } from "react";
import {
  getIngresos, crearIngreso, eliminarIngreso, actualizarIngreso,
  getEgresos,  crearEgreso,  eliminarEgreso,  actualizarEgreso,
  getPrestamos, crearPrestamo, eliminarPrestamo, actualizarPrestamo,
  getResumenFinanciero,
} from "../services/finanzas.api";
import type { Ingreso, Egreso, Prestamo, ResumenFinanciero } from "../types/finanzas.types";

export function useFinanzas() {
  const [ingresos,  setIngresos]  = useState<Ingreso[]>([]);
  const [egresos,   setEgresos]   = useState<Egreso[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [resumen,   setResumen]   = useState<ResumenFinanciero | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Ingresos ────────────────────────────────────────────────

  const cargarIngresos = useCallback(async (filtros?: {
    desde?: string; hasta?: string; estado?: string; mes?: number; anio?: number;
  }) => {
    setCargando(true);
    try {
      const data = await getIngresos(filtros);
      setIngresos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar ingresos");
    } finally {
      setCargando(false);
    }
  }, []);

  const agregarIngreso = useCallback(async (payload: any) => {
    const nuevo = await crearIngreso(payload);
    setIngresos((prev) => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const borrarIngreso = useCallback(async (id: string) => {
    await eliminarIngreso(id);
    setIngresos((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Egresos ─────────────────────────────────────────────────

  const cargarEgresos = useCallback(async (filtros?: {
    categoria?: string; estado?: string; mes?: number; anio?: number;
  }) => {
    setCargando(true);
    try {
      const data = await getEgresos(filtros);
      setEgresos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar egresos");
    } finally {
      setCargando(false);
    }
  }, []);

  const agregarEgreso = useCallback(async (payload: any) => {
    const nuevo = await crearEgreso(payload);
    setEgresos((prev) => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const borrarEgreso = useCallback(async (id: string) => {
    await eliminarEgreso(id);
    setEgresos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Préstamos ────────────────────────────────────────────────

  const cargarPrestamos = useCallback(async (filtros?: { estado?: string }) => {
    setCargando(true);
    try {
      const data = await getPrestamos(filtros);
      setPrestamos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar préstamos");
    } finally {
      setCargando(false);
    }
  }, []);

  const agregarPrestamo = useCallback(async (payload: any) => {
    const nuevo = await crearPrestamo(payload);
    setPrestamos((prev) => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const borrarPrestamo = useCallback(async (id: string) => {
    await eliminarPrestamo(id);
    setPrestamos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Resumen ─────────────────────────────────────────────────

  const cargarResumen = useCallback(async (filtros?: { mes?: number; anio?: number; tipo_cambio?: number }) => {
    try {
      const data = await getResumenFinanciero(filtros);
      setResumen(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar resumen");
    }
  }, []);

  return {
    ingresos, egresos, prestamos, resumen, cargando, error,
    cargarIngresos,  agregarIngreso,  borrarIngreso,
    cargarEgresos,   agregarEgreso,   borrarEgreso,
    cargarPrestamos, agregarPrestamo, borrarPrestamo,
    cargarResumen,
    actualizarIngreso, actualizarEgreso, actualizarPrestamo,
  };
}
