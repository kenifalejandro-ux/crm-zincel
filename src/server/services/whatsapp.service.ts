/** src/server/services/whatsapp.service.ts */

import axios from "axios";
import { pool } from "../config/database";
import { env } from "../config/env";

const WA_API = "https://graph.facebook.com/v19.0";

function headers() {
  return { Authorization: `Bearer ${env.waAccessToken}`, "Content-Type": "application/json" };
}

export async function enviarMensajeTexto(
  numero: string,
  mensaje: string,
  prospectoId?: string,
  empresa?: string
): Promise<{ wamid: string }> {
  const numeroLimpio = numero.replace(/\D/g, "");

  const { data } = await axios.post(
    `${WA_API}/${env.waPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type:    "individual",
      to:                numeroLimpio,
      type:              "text",
      text:              { preview_url: false, body: mensaje },
    },
    { headers: headers() }
  );

  const wamid = data.messages?.[0]?.id ?? null;

  await pool.query(
    `INSERT INTO whatsapp_mensajes (empresa, prospecto_id, numero_destino, tipo, contenido, estado, wamid)
     VALUES ($1, $2, $3, 'text', $4, 'enviado', $5)`,
    [empresa ?? null, prospectoId ?? null, numeroLimpio, mensaje, wamid]
  );

  return { wamid };
}

export async function enviarTemplate(
  numero: string,
  templateName: string,
  languageCode: string,
  componentes: any[],
  prospectoId?: string,
  empresa?: string
): Promise<{ wamid: string }> {
  const numeroLimpio = numero.replace(/\D/g, "");

  const { data } = await axios.post(
    `${WA_API}/${env.waPhoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to:                numeroLimpio,
      type:              "template",
      template: {
        name:       templateName,
        language:   { code: languageCode },
        components: componentes,
      },
    },
    { headers: headers() }
  );

  const wamid = data.messages?.[0]?.id ?? null;

  await pool.query(
    `INSERT INTO whatsapp_mensajes (empresa, prospecto_id, numero_destino, tipo, template_nombre, estado, wamid)
     VALUES ($1, $2, $3, 'template', $4, 'enviado', $5)`,
    [empresa ?? null, prospectoId ?? null, numeroLimpio, templateName, wamid]
  );

  return { wamid };
}

export async function obtenerTemplates(): Promise<any[]> {
  const { data } = await axios.get(
    `${WA_API}/${env.waWabaId}/message_templates`,
    {
      headers: headers(),
      params:  { limit: 100, status: "APPROVED" },
    }
  );
  return data.data ?? [];
}

export async function obtenerHistorial(prospectoId?: string, empresa?: string): Promise<any[]> {
  const conds: string[] = [];
  const vals:  any[]    = [];
  let idx = 1;

  if (prospectoId) { conds.push(`prospecto_id = $${idx++}`); vals.push(prospectoId); }
  if (empresa)     { conds.push(`empresa ILIKE $${idx++}`);   vals.push(empresa);     }

  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT * FROM whatsapp_mensajes ${where} ORDER BY creado_en DESC LIMIT 100`,
    vals
  );
  return rows;
}
