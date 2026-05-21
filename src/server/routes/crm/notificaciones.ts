/** src/server/routes/crm/notificaciones.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from "../../services/notificaciones.service";

export const notificacionesRouter = Router();
notificacionesRouter.use(authMiddleware);

// GET /notificaciones — lista las últimas 30
notificacionesRouter.get("/", async (req, res) => {
  try {
    const data = await obtenerNotificaciones(req.usuario.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

// GET /notificaciones/count — conteo de no leídas (para el badge)
notificacionesRouter.get("/count", async (req, res) => {
  try {
    const total = await contarNoLeidas(req.usuario.id);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Error al contar notificaciones" });
  }
});

// PUT /notificaciones/:id/leer — marca una como leída
notificacionesRouter.put("/:id/leer", async (req, res) => {
  try {
    await marcarLeida(req.params.id, req.usuario.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al marcar notificación" });
  }
});

// PUT /notificaciones/leer-todo — marca todas como leídas
notificacionesRouter.put("/leer-todo", async (req, res) => {
  try {
    await marcarTodasLeidas(req.usuario.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al marcar notificaciones" });
  }
});
