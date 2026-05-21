import type { Logger } from "pino";

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    validatedBody?: unknown;
    log?: Logger;
    usuario: { id: string; rol: string; nombre: string; email: string };
  }
}

export {};
