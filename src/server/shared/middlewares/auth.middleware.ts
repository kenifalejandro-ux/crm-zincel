/**src/server/shared/middlewares/auth.middleware.ts */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getRedis } from "../../config/redis";
import { logger } from "../../config/logger";
import type { UsuarioPayload } from "../../services/auth.service";

const JWT_SECRET = process.env.JWT_SECRET || "crm_secret_cambiar_en_produccion";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    // Verificar JWT
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioPayload;

    // Verificar sesión activa en Redis
    const redis = getRedis();
    if (redis) {
      try {
        const sesionToken = await redis.get(`session:${payload.id}`);
        if (!sesionToken || sesionToken !== token) {
          return res.status(401).json({ ok: false, message: "Sesión expirada o inválida" });
        }
      } catch (err) {
        logger.warn({ err }, "Error al verificar sesión en Redis, continuando sin Redis");
      }
    }

    // Adjuntar usuario al request
    (req as any).usuario = payload;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ ok: false, message: "Token expirado" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ ok: false, message: "Token inválido" });
    }
    logger.error({ err }, "Error en authMiddleware");
    return res.status(500).json({ ok: false, message: "Error de autenticación" });
  }
}