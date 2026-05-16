/**src/server/schemas/finanzas.schema.ts */

import { z } from "zod";

// ── INGRESOS ──────────────────────────────────────────────────

export const crearIngresoSchema = z.object({
  prospecto_id:     z.string().uuid().optional(),
  empresa:          z.string().min(1, "El nombre es obligatorio").max(200),
  descripcion:      z.string().min(1, "La descripción es obligatoria").max(300),
  tipo_servicio:    z.enum([
    "desarrollo_web", "wordpress", "diseño_marketing", "redes_sociales",
    "publicidad_digital", "erp", "crm", "otro",
  ]).default("otro"),
  monto_total:      z.number().positive("El monto debe ser positivo"),
  adelanto:         z.number().min(0).default(0),
  moneda:           z.enum(["PEN", "USD"]).default("PEN"),
  estado:           z.enum(["por_cobrar", "cobrado_parcial", "cobrado", "vencido"]).default("por_cobrar"),
  fecha:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tipo_cambio:      z.number().positive().default(1),
  notas:            z.string().optional(),
});

export const actualizarIngresoSchema = crearIngresoSchema.partial();

export type CrearIngresoInput      = z.infer<typeof crearIngresoSchema>;
export type ActualizarIngresoInput = z.infer<typeof actualizarIngresoSchema>;

// ── EGRESOS ───────────────────────────────────────────────────

export const crearEgresoSchema = z.object({
  categoria:   z.enum([
    "publicidad_digital", "herramientas_saas", "herramientas_ia",
    "infraestructura_digital", "subcontratos",
  ]),
  descripcion: z.string().min(1, "La descripción es obligatoria").max(300),
  proveedor:   z.string().max(200).optional(),
  monto:       z.number().positive("El monto debe ser positivo"),
  moneda:      z.enum(["PEN", "USD"]).default("PEN"),
  frecuencia:  z.enum(["mensual", "anual", "unico"]).default("unico"),
  estado:            z.enum(["pendiente", "pagado"]).default("pendiente"),
  fecha:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tipo_cambio:       z.number().positive().default(1),
  notas:             z.string().optional(),
});

export const actualizarEgresoSchema = crearEgresoSchema.partial();

export type CrearEgresoInput      = z.infer<typeof crearEgresoSchema>;
export type ActualizarEgresoInput = z.infer<typeof actualizarEgresoSchema>;

// ── PRÉSTAMOS ─────────────────────────────────────────────────

export const crearPrestamoSchema = z.object({
  categoria:        z.enum([
    "herramientas_ia", "infraestructura_digital", "publicidad_digital",
    "herramientas_saas", "subcontratos", "personal", "otro",
  ]).default("otro"),
  descripcion:      z.string().min(1, "La descripción es obligatoria").max(300),
  prestamista:      z.string().max(200).optional(),
  monto:            z.number().positive("El monto debe ser positivo"),
  moneda:           z.enum(["PEN", "USD"]).default("PEN"),
  estado:           z.enum(["por_pagar", "pagado", "vencido"]).default("por_pagar"),
  fecha:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_pago:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tipo_cambio:      z.number().positive().default(1),
  notas:            z.string().optional(),
});

export const actualizarPrestamoSchema = crearPrestamoSchema.partial();

export type CrearPrestamoInput      = z.infer<typeof crearPrestamoSchema>;
export type ActualizarPrestamoInput = z.infer<typeof actualizarPrestamoSchema>;
