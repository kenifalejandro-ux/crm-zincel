/** src/server/services/metaLeadAds.service.ts */

import { pool } from "../config/database";
import { env } from "../config/env";
import { crearProspectoService } from "./prospecto.service";
import { crearProspectoSchema } from "../schemas/prospecto.schema";

const META_API = "https://graph.facebook.com/v21.0";

interface FieldData {
  name: string;
  values: string[];
}

interface MetaLeadData {
  id: string;
  field_data: FieldData[];
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  page_id?: string;
}

function parseFields(fieldData: FieldData[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const f of fieldData) {
    result[f.name] = f.values?.[0] ?? "";
  }
  return result;
}

async function resolverTokenPorPagina(pageId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT access_token FROM plataforma_cuentas
     WHERE plataforma = 'meta' AND activo = true AND page_id = $1
     LIMIT 1`,
    [pageId]
  );
  if (rows[0]?.access_token) return rows[0].access_token;

  // Fallback: cualquier cuenta meta activa
  const fallback = await pool.query(
    `SELECT access_token FROM plataforma_cuentas
     WHERE plataforma = 'meta' AND activo = true
     LIMIT 1`
  );
  if (fallback.rows[0]?.access_token) return fallback.rows[0].access_token;

  return env.metaAccessToken;
}

async function fetchLeadData(leadId: string, token: string): Promise<MetaLeadData> {
  const url = `${META_API}/${leadId}?fields=field_data,ad_id,ad_name,campaign_id,campaign_name,form_id,page_id&access_token=${token}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  if (data.error) throw new Error(`Meta Lead API: ${data.error.message}`);
  return data as MetaLeadData;
}

export async function procesarMetaLead(leadId: string, pageId: string, campanaInfo: {
  ad_name?: string;
  campaign_name?: string;
  form_id?: string;
}) {
  const token = await resolverTokenPorPagina(pageId);
  const leadData = await fetchLeadData(leadId, token);
  const fields = parseFields(leadData.field_data ?? []);

  const nombreCompleto = `${fields["first_name"] ?? ""} ${fields["last_name"] ?? ""}`.trim();
  const nombre = fields["full_name"] || nombreCompleto || "Sin nombre";

  const empresa = fields["company_name"] || fields["empresa"] || "Particular";
  const telefono = fields["phone_number"] || fields["telefono"] || "";
  const email = fields["email"] || fields["email_address"] || "";

  const campana = leadData.campaign_name || campanaInfo.campaign_name || "";
  const anuncio = leadData.ad_name || campanaInfo.ad_name || "";

  const notas = [
    campana && `Campaña: ${campana}`,
    anuncio && `Anuncio: ${anuncio}`,
    `Lead ID: ${leadId}`,
  ].filter(Boolean).join(" | ");

  const input = crearProspectoSchema.parse({
    empresa,
    nombre_contacto: nombre,
    telefono,
    email_contacto: email,
    fuente: "facebook",
    estado_lead: "nuevo",
    clasificacion: "por_gestionar",
    calidad_lead: "sin_calificar",
    campana_origen: campana || null,
    notas,
  });

  await crearProspectoService(input, "webhook-meta");
}
