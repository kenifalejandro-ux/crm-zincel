/**src/server/shared/middlewares/error.middleware.ts */


import type { ErrorRequestHandler } from "express";
import { logger } from "../../config/logger";
import { getRequestId } from "../../shared/utils/request";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = getRequestId(req);

  if (req.log) {
    req.log.error({ err: error, requestId }, "Error no controlado");
  } else {
    logger.error({ err: error, requestId }, "Error no controlado");
  }

  if (res.headersSent) return;

  // Errores de validación Zod
  if (error.name === "ZodError") {
    return res.status(400).json({
      ok: false,
      message: "Error de validación",
      errores: error.errors,
      requestId,
    });
  }

  // Errores de PostgreSQL
  if (error.code === "23505") {
    return res.status(409).json({
      ok: false,
      message: "Ya existe un registro con esos datos",
      requestId,
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      ok: false,
      message: "Referencia inválida, el registro relacionado no existe",
      requestId,
    });
  }

  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
    requestId,
  });
};