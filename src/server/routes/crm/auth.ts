/**src/server/routes/crm/auth.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { loginSchema } from "../../schemas/auth.schema";
import { loginService, logoutService } from "../../services/auth.service";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { env } from "../../config/env";
import { verifyRecaptcha } from "../../middleware/verifyRecaptcha";
import bcrypt from "bcrypt";
import { pool } from "../../config/database";

export const authRouter = Router();

// POST /api/crm/auth/login
authRouter.post(
  "/login",
  validate(loginSchema),
  ...(env.isProduction ? [verifyRecaptcha] : []),
  async (req, res) => {
    try {
      const result = await loginService(req.body);
      res.status(200).json({
        ok: true,
        token: result.token,
        usuario: result.usuario,
      });
    } catch (err: any) {
      res.status(401).json({ ok: false, message: err.message });
    }
  }
);

// POST /api/crm/auth/logout
authRouter.post("/logout", authMiddleware, async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    await logoutService(usuario.id);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/auth/me
authRouter.get("/me", authMiddleware, (req, res) => {
  const usuario = (req as any).usuario;
  res.status(200).json({ ok: true, usuario });
  
});

// PUT /api/crm/auth/cambiar-password
authRouter.put("/cambiar-password", authMiddleware, async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const { password_actual, password_nuevo } = req.body;

    if (!password_actual || !password_nuevo) {
      return res.status(400).json({ ok: false, message: "Ambas contraseñas son obligatorias" });
    }
    if (password_nuevo.length < 6) {
      return res.status(400).json({ ok: false, message: "La nueva contraseña debe tener mínimo 6 caracteres" });
    }

    // Verificar password actual
    const result = await pool.query(
      `SELECT password_hash FROM usuarios WHERE id = $1`,
      [usuario.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    const valido = await bcrypt.compare(password_actual, result.rows[0].password_hash);
    if (!valido) {
      return res.status(401).json({ ok: false, message: "La contraseña actual es incorrecta" });
    }

    // Actualizar password
    const nuevoHash = await bcrypt.hash(password_nuevo, 10);
    await pool.query(
      `UPDATE usuarios SET password_hash = $1 WHERE id = $2`,
      [nuevoHash, usuario.id]
    );

    res.status(200).json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});