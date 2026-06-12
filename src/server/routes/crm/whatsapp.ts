/** src/server/routes/crm/whatsapp.ts */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  enviarMensajeTexto,
  enviarTemplate,
  obtenerTemplates,
  obtenerHistorial,
} from "../../services/whatsapp.service";

export const whatsappRouter = Router();
whatsappRouter.use(authMiddleware);

// POST /api/crm/whatsapp/send
whatsappRouter.post("/send", async (req, res) => {
  const { numero, mensaje, prospecto_id, empresa } = req.body;
  if (!numero || !mensaje) return res.status(400).json({ message: "numero y mensaje requeridos" });
  try {
    const result = await enviarMensajeTexto(numero, mensaje, prospecto_id, empresa);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: msg });
  }
});

// POST /api/crm/whatsapp/send-template
whatsappRouter.post("/send-template", async (req, res) => {
  const { numero, template, language = "es", componentes = [], prospecto_id, empresa } = req.body;
  if (!numero || !template) return res.status(400).json({ message: "numero y template requeridos" });
  try {
    const result = await enviarTemplate(numero, template, language, componentes, prospecto_id, empresa);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: msg });
  }
});

// GET /api/crm/whatsapp/templates
whatsappRouter.get("/templates", async (_req, res) => {
  try {
    const templates = await obtenerTemplates();
    res.json({ data: templates });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/whatsapp/historial?prospecto_id=X&empresa=Y
whatsappRouter.get("/historial", async (req, res) => {
  const { prospecto_id, empresa } = req.query as Record<string, string>;
  try {
    const rows = await obtenerHistorial(prospecto_id, empresa);
    res.json({ data: rows });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
