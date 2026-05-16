/**src/server/shared/middlewares/roles.middleware.ts */

import type { Request, Response, NextFunction } from "express";

export function rolesMiddleware(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({ ok: false, message: "No autenticado" });
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(" o ")}`,
      });
    }

    next();
  };
}