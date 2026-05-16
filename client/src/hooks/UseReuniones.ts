/** client/src/hooks/useReuniones.ts */

import { useState, useCallback } from "react";

import {
  getReuniones,
  crearReunion,
  actualizarReunion,
  marcarEmailEnviado,
  getResumenReuniones,
  eliminarReunionesMasivoService,
} from "../services/reuniones.api";

import type {
  Reunion,
  CrearReunionPayload,
  ResumenReuniones,
} from "../types/reunion.types";

interface ReunionesFiltros {
  estado?: string;
  periodo?: string;
}

export function useReuniones() {
  const [reuniones, setReuniones] = useState<Reunion[]>([]);

  const [resumen, setResumen] =
    useState<ResumenReuniones | null>(null);

  const [cargando, setCargando] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ── Cargar reuniones ─────────────────────────────────
  const cargarReuniones = useCallback(
    async (filtros?: ReunionesFiltros) => {
      setCargando(true);

      try {
        const data = await getReuniones(filtros);

        setReuniones(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Error al cargar reuniones"
        );
      } finally {
        setCargando(false);
      }
    },
    []
  );

  // ── Cargar resumen ───────────────────────────────────
  const cargarResumen = useCallback(async () => {
    try {
      const data = await getResumenReuniones();

      setResumen(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al cargar resumen"
      );
    }
  }, []);

  // ── Crear reunión ────────────────────────────────────
  const agregarReunion = useCallback(
    async (payload: CrearReunionPayload) => {
      const nueva = await crearReunion(payload);

      setReuniones((prev) => [nueva, ...prev]);

      return nueva;
    },
    []
  );

  // ── Eliminar reunión ─────────────────────────────────
  const borrarReunion = useCallback(
    async (id: string) => {
      await eliminarReunionesMasivoService([id]);

      setReuniones((prev) =>
        prev.filter((r) => r.id !== id)
      );
    },
    []
  );

  // ── Actualizar reunión ───────────────────────────────
  const editarReunion = useCallback(
    async (
      id: string,
      payload: Partial<CrearReunionPayload>
    ) => {
      const actualizada = await actualizarReunion(
        id,
        payload
      );

      setReuniones((prev) =>
        prev.map((r) =>
          r.id === id ? actualizada : r
        )
      );

      return actualizada;
    },
    []
  );

  // ── Cambiar estado ───────────────────────────────────
  const cambiarEstado = useCallback(
    async (id: string, estado: string) => {
        const actualizada = await actualizarReunion(    id, { estado: estado as any });

      setReuniones((prev) =>
        prev.map((r) =>
          r.id === id ? actualizada : r
        )
      );

      return actualizada;
    },
    []
  );

  // ── Marcar email enviado ─────────────────────────────
  const enviarEmail = useCallback(
    async (id: string) => {
      const actualizada =
        await marcarEmailEnviado(id);

      setReuniones((prev) =>
        prev.map((r) =>
          r.id === id ? actualizada : r
        )
      );

      return actualizada;
    },
    []
  );

  return {
    reuniones,
    resumen,
    cargando,
    error,

    cargarReuniones,
    cargarResumen,

    agregarReunion,
    borrarReunion,

    editarReunion,
    cambiarEstado,

    enviarEmail,
  };
}