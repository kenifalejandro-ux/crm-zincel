/**src/server/services/auth.service.ts */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";
import type { LoginInput } from "../schemas/auth.schema";

const JWT_SECRET = process.env.JWT_SECRET || "crm_secret_cambiar_en_produccion";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";
const SESSION_TTL = 60 * 60 * 8; // 8 horas en segundos

export interface UsuarioPayload {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export async function loginService(input: LoginInput): Promise<{ token: string; usuario: UsuarioPayload }> {
  console.log("🔍 Intentando login con email:", input.email);
  
  const result = await pool.query(
    `SELECT id, nombre, email, password_hash, rol, activo
     FROM usuarios WHERE email = $1 LIMIT 1`,
    [input.email]
  );

  console.log("🔍 Usuarios encontrados:", result.rows.length);
  console.log("🔍 Email buscado:", input.email);
  
  if (result.rows.length > 0) {
    console.log("🔍 Email en DB:", result.rows[0].email);
    console.log("🔍 Hash en DB:", result.rows[0].password_hash);
  }



  const usuario = result.rows[0];

  if (!usuario) {
    throw new Error("Credenciales inválidas");
  }

  if (!usuario.activo) {
    throw new Error("Usuario inactivo, contacta al administrador");
  }

  // Verificar password
  const passwordValido = await bcrypt.compare(input.password, usuario.password_hash);
  if (!passwordValido) {
    throw new Error("Credenciales inválidas");
  }

  // Generar JWT
  const payload: UsuarioPayload = {
    id:     usuario.id,
    nombre: usuario.nombre,
    email:  usuario.email,
    rol:    usuario.rol,
  };

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES as jwt.SignOptions["expiresIn"] });

  // Guardar sesión en Redis
  const redis = getRedis();
  if (redis) {
    try {
      await redis.setex(`session:${usuario.id}`, SESSION_TTL, token);
    } catch (err) {
      logger.warn({ err }, "No se pudo guardar sesión en Redis");
    }
  }

  logger.info({ userId: usuario.id, email: usuario.email }, "Login exitoso");

  return { token, usuario: payload };
}

export async function logoutService(userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(`session:${userId}`);
    } catch (err) {
      logger.warn({ err }, "No se pudo eliminar sesión de Redis");
    }
  }
  logger.info({ userId }, "Logout exitoso");
}

export async function verificarSesionService(userId: string, token: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  try {
    const sesionToken = await redis.get(`session:${userId}`);
    return sesionToken === token;
  } catch (err) {
    logger.warn({ err }, "Error al verificar sesión en Redis");
    return true;
  }
}