/** client/src/utils/prospectos.mappers.ts */

export const mapEstado = (valor: any) => {
  if (!valor) return "por_gestionar";
  const map: Record<string, string> = {
    // Interesado
    "interesado":            "interesado",
    "solicita información":  "interesado",
    "solicita informacion":  "interesado",
    "plan estratégico":      "interesado",
    "plan estrategico":      "interesado",
    // No interesado
    "no interesado":         "no_interesado",
    "con página web":        "no_interesado",
    "con pagina web":        "no_interesado",
    "ya tiene proveedor":    "ya_tiene_proveedor",
    // No contesta
    "no contesta":           "no_contesta",
    "no entra llamada":      "no_contesta",
    "corto llamada":         "no_contesta",
    "cortó llamada":         "no_contesta",
    "apagado":               "no_contesta",
    "envío brochure":        "no_contesta",
    "envio brochure":        "no_contesta",
    lead:                    "no_contesta",
    // Volver a llamar
    "volver a llamar":       "volver_a_llamar",
    "ocupado":               "volver_a_llamar",
    "lo van evaluar":        "volver_a_llamar",
    "lo van a evaluar":      "volver_a_llamar",
    // Buzón
    "buzon de voz":          "buzon_de_voz",
    "buzón de voz":          "buzon_de_voz",
    // Fuera de servicio
    "fuera de servicio":     "fuera_de_servicio",
    // Equivocado
    "numero equivocado":     "numero_equivocado",
    "número equivocado":     "numero_equivocado",
    "equivocado":            "numero_equivocado",
  };
  return map[String(valor).toLowerCase().trim()] || "por_gestionar";
};

export const mapClasificacion = (valor: any) => {
  if (!valor) return "por_gestionar";
  const map: Record<string, string> = {
    "por gestionar": "por_gestionar",
    lead:            "por_gestionar",
    prospecto:       "por_gestionar",
    gestionado:      "gestionado",
    seguimiento:     "gestionado",
    cerrado:         "cerrado",
    descartado:      "descartado",
    "no interesado": "descartado",
  };
  return map[String(valor).toLowerCase().trim()] || "por_gestionar";
};

export const mapTamanoEmpresa = (valor: any) => {
  if (!valor) return undefined;
  const text = String(valor).toLowerCase().trim();
  if (text.includes("peque")) return "1_10";
  if (text.includes("11") || text.includes("11-50")) return "11_50";
  if (text.includes("51") || text.includes("51-200")) return "51_200";
  if (text.includes("201") || text.includes("201-500")) return "201_500";
  if (text.includes("mas") || text.includes("más") || text.includes("grande")) return "mas_500";
  return undefined;
};

export const mapPrioridad = (valor: any) => {
  if (!valor) return "media";
  const text = String(valor).toLowerCase().trim();
  if (text.includes("alta")) return "alta";
  if (text.includes("baja")) return "baja";
  if (text.includes("media")) return "media";
  return "media";
};

export const mapFuenteLead = (valor: any) => {
  if (!valor) return undefined;
  const text = String(valor).toLowerCase().trim();
  if (text.includes("facebook")) return "facebook";
  if (text.includes("instagram")) return "instagram";
  if (text.includes("tiktok")) return "tiktok";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("referido")) return "referido";
  if (text.includes("web")) return "web";
  if (text.includes("llamada") || text.includes("fria") || text.includes("fría")) return "llamada_fria";
  return "otro";
};

export const mapEstadoVenta = (valor: any) => {
  if (!valor) return "no";
  const text = String(valor).toLowerCase().trim();
  return ["si", "sí", "yes", "y", "1", "true"].includes(text) ? "si" : "no";
};

export const mapCanalContacto = (valor: any) => {
  if (!valor) return "llamada";
  const map: Record<string, string> = {
    llamada:   "llamada",
    phone:     "llamada",
    telefono:  "llamada",
    whatsapp:  "whatsapp",
    whatsap:   "whatsapp",
    correo:    "correo",
    email:     "correo",
    linkedin:  "linkedin",
    instagram: "instagram",
    facebook:  "facebook",
  };
  return map[String(valor).toLowerCase().trim()] || "llamada";
};

export const mapReunionModalidad = (valor: any) => {
  if (!valor) return "google_meet";
  const text = String(valor).toLowerCase().trim();
  if (text.includes("presencial")) return "presencial";
  if (text.includes("zoom")) return "zoom";
  if (text.includes("teams")) return "teams";
  if (text.includes("whatsapp")) return "whatsapp_video";
  return "google_meet";
};

export const mapReunionEstado = (valor: any) => {
  if (!valor) return "programada";
  const text = String(valor).toLowerCase().trim();
  if (text.includes("realizada")) return "realizada";
  if (text.includes("cancelada")) return "cancelada";
  if (text.includes("reprogram")) return "reprogramada";
  if (text.includes("en proceso") || text.includes("en_proceso")) return "en_proceso";
  return "programada";
};

export const normalizarBool = (valor: any) => {
  if (valor === undefined || valor === null) return false;
  const text = String(valor).toLowerCase().trim();
  return ["si", "sí", "yes", "y", "1", "true"].includes(text);
};

export const parseFecha = (valor: any): string | null => {
  if (!valor) return null;
  let text = String(valor)
    .trim()
    .replace(/\./g, "-")
    .replace(/\//g, "-")
    .replace(/\s+/g, " ");
  if (!text) return null;

  const numValue = Number(text);
  if (!isNaN(numValue) && numValue > 1000) {
    const date = new Date(Date.UTC(1899, 11, 30) + numValue * 86400000);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      if (y >= 2000 && y <= 2030) return `${y}-${m}-${d}`;
    }
    return null;
  }

  const fechaMatch = text.match(/(\d{1,2})[-](\d{1,2})[-](\d{2,4})/);
  if (fechaMatch) {
    const [_, day, month, year] = fechaMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const dateStr = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const date = new Date(dateStr + "T00:00:00.000Z");
    if (!isNaN(date.getTime())) return dateStr;
  }

  const fechaIsoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (fechaIsoMatch) {
    const date = new Date(fechaIsoMatch[0] + "T00:00:00.000Z");
    if (!isNaN(date.getTime())) return fechaIsoMatch[0];
  }

  const date = new Date(text);
  if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];

  return null;
};

export const parseHora = (valor: any): string => {
  if (!valor) return "09:00";
  const text = String(valor).trim().replace(/\./g, ":").replace(/\s+/g, " ");
  const horaMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (horaMatch) return `${horaMatch[1].padStart(2, "0")}:${horaMatch[2]}`;
  const digits = text.match(/^(\d{1,2})$/);
  if (digits) return `${digits[1].padStart(2, "0")}:00`;
  return "09:00";
};

export const parseExcelDate = (dateValue: any, timeValue?: any): string | null => {
  const fecha = parseFecha(dateValue);
  if (!fecha) return null;
  const year = parseInt(fecha.split("-")[0]);
  if (year < 2000 || year > 2030) return null;
  const hora = parseHora(timeValue);
  const dateTimeStr = `${fecha}T${hora}:00.000Z`;
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return null;
  return dateTimeStr;
};

export const mapearExcelACRM = (rows: any[]) => {
  const empresasVistas = new Map<string, any>();

  rows.forEach((row) => {
    const empresa = String(row["EMPRESA"] || row["Empresa"] || "").trim().slice(0, 200);
    if (!empresa) return;

    const nombreContacto = String(
      row["Coordinador"] || row["Coordinador de contacto"] || row["Nombre contacto"] || ""
    ).trim().slice(0, 150);
    const telefono = String(row["Celular"] || row["Teléfono"] || row["Telefono"] || "").trim().slice(0, 30);
    const emailContacto = String(row["Email"] || row["Correo"] || row["E-mail"] || "").trim().slice(0, 150);
    const ciudad = String(row["Provincia"] || row["Ciudad"] || "").trim().slice(0, 100);
    const pais = String(row["País"] || row["Pais"] || "").trim().slice(0, 100);
    const estadoLead = mapEstado(row["Resultado del contacto"] || row["Estado"] || "");
    const clasificacion = mapClasificacion(row["Clasificación"] || row["Clasificacion"] || "");
    const estadoVenta = mapEstadoVenta(row["Venta Cerrada"] || row["Venta cerrada"] || row["Venta"] || "");
    const prioridad = mapPrioridad(row["Prioridad"] || row["Prioridad del prospecto"] || row["PRIORIDAD_WEB"] || "");
    const fuente = mapFuenteLead(row["Fuente"] || row["Canal"] || row["Origen"] || "");
    const notas = String(row["COMENTARIOS"] || row["Comentarios"] || "").trim();

    const llamadaRealizada = normalizarBool(
      row["Llamada realizada"] || row["Llamada realizada?"] || row["Llamada"] || ""
    );
    const contestada = normalizarBool(row["Contestó"] || row["Contesto"] || "");
    const primerContacto = String(row["Primer-Contacto"] || row["Primer Contacto"] || "").trim();
    const medio = String(row["Medio"] || "").trim();
    const intentos = String(row["# Intentos"] || row["Intentos"] || "").trim();
    const mensaje = String(row["Mensaje"] || row["Mensaje enviado"] || "").trim();
    const brochure = normalizarBool(row["Brochure"] || "");
    const brochureCanal = String(row["Canal"] || "").trim();
    const agendaReunion = normalizarBool(row["Agenda Reunión"] || row["Agenda Reunion"] || row["Agenda"] || "");
    const modalidadReunion = mapReunionModalidad(row["Modalidad"] || "");
    const fechaReunion = parseExcelDate(
      row["Fecha"] || row["Fecha Reunion"] || row["Fecha reunión"] || row["Fecha de reunión"] || "",
      row["Hora"] || ""
    );
    const estadoReunion = mapReunionEstado(
      row["Estado de la Reunión"] || row["Estado reunion"] || row["Estado reunión"] || ""
    );
    const ingresoReunion = String(
      row["Ingreso a la Reunión"] || row["Ingreso a la Reunion"] || row["Ingreso reunión"] || ""
    ).trim();
    const paginaWeb = String(
      row["Página web"] || row["Pagina web"] || row["Web"] || row["Enlace"] || row["Link"] || ""
    ).trim().slice(0, 300);
    const webActiva = normalizarBool(
      row["Web activa"] || row["Web activa?"] || row["Web_activa"] || row["Tiene web"] || ""
    );

    const fila: any = {
      empresa,
      actividad_economica: String(row["RUBRO"] || row["Rubro"] || row["ACTIVIDAD_ECONOMICA"] || row["Actividad economica"] || "").trim().slice(0, 500),
      web_activa:        webActiva,
      pagina_web:        paginaWeb || undefined,
      proveedor_web:     String(row["Proveedor"] || row["Proveedor web"] || "").trim().slice(0, 200),
      region:            String(row["Region"] || row["Región"] || "").trim().slice(0, 200),
      pais,
      nombre_contacto:   nombreContacto,
      llamada_realizada: String(row["Llamada realizada"] || row["llamada realizada?"] || row["Llamada"] || "").trim(),
      medio_llamada:     String(row["Medio"] || "").trim(),
      cargo:             String(row["Cargo"] || "").trim().slice(0, 100),
      telefono,
      email_contacto:    emailContacto,
      ciudad,
      tamano_empresa:    mapTamanoEmpresa(row["TAMANO_ESTIMADO"] || row["Tamano estimado"] || row["Tamaño estimado"] || ""),
      estado_lead:       estadoLead,
      clasificacion,
      estado_venta:      estadoVenta,
      prioridad,
      fuente,
      notas,
      llamadas:          [] as any[],
      brochures:         [] as any[],
      reuniones:         [] as any[],
    };

    const fechasLlamada: string[] = [
      parseExcelDate(row["Fecha Primera llamada"] || row["Fecha Primera Llamada"] || row["Fecha primera llamada"] || "", "09:00"),
      parseExcelDate(row["Fecha segunda llamada"] || row["Fecha Segunda llamada"] || row["Segunda llamada"] || "", "09:00"),
      parseExcelDate(row["Fecha tercera llamada"] || row["Fecha Tercera llamada"] || row["Tercera llamada"] || "", "09:00"),
    ].filter((f): f is string => f !== null);

    // Crear llamada SOLO si "Llamada realizada" está marcada explícitamente como Sí
    const tieneDataLlamada = llamadaRealizada;

    if (tieneDataLlamada) {
      const llamadaNotas = [
        mensaje && `Mensaje: ${mensaje}`,
        intentos && `Intentos: ${intentos}`,
        primerContacto && `Primer contacto: ${primerContacto}`,
        ingresoReunion && `Ingreso reunión: ${ingresoReunion}`,
      ].filter(Boolean).join(" | ");

      // Si no hay fecha explícita pero sí hay otros datos, usar fecha de hoy
      if (fechasLlamada.length === 0) {
        fechasLlamada.push(new Date().toISOString());
      }

      fechasLlamada.forEach((fechaLlamada, index) => {
        fila.llamadas.push({
          fecha:            fechaLlamada,
          canal:            mapCanalContacto(medio),
          contestada,
          duracion_minutos: 0,
          resultado:        estadoLead === "no_contesta" ? undefined : estadoLead,
          notas:            `${llamadaNotas || ""} ${index > 0 ? `(Llamada ${index + 1})` : ""}`.trim() || undefined,
        });
      });
    }

    if (brochure) {
      fila.brochures.push({
        canal:      mapCanalContacto(brochureCanal || medio),
        fecha_envio: new Date().toISOString(),
        notas:      mensaje || "Brochure importado",
      });
    }

    if (agendaReunion && fechaReunion) {
      const reunionNotas = [
        mensaje && `Mensaje: ${mensaje}`,
        ingresoReunion && `Ingreso a la reunión: ${ingresoReunion}`,
      ].filter(Boolean).join(" | ");

      fila.reuniones.push({
        titulo:    "Reunión importada",
        fecha_hora: fechaReunion,
        modalidad: modalidadReunion,
        enlace:    String(row["Enlace"] || "").trim() || undefined,
        estado:    estadoReunion,
        notas:     reunionNotas || undefined,
      });
    }

    if (!empresasVistas.has(empresa)) {
      empresasVistas.set(empresa, fila);
    } else {
      const existente = empresasVistas.get(empresa);
      existente.notas = [fila.notas, existente.notas].filter(Boolean).join(" | ");
      existente.llamadas.push(...fila.llamadas);
      existente.brochures.push(...fila.brochures);
      existente.reuniones.push(...fila.reuniones);
    }
  });

  return Array.from(empresasVistas.values());
};

// ── CONSTANTES ─────────────────────────────────────────────────────────────

export const ESTADOS_LEAD = [
  { value: "",                    label: "Todos los estados" },
  { value: "nuevo",               label: "Nuevo (última carga)" },
  { value: "por_gestionar",       label: "Por gestionar" },
  { value: "interesado",          label: "Interesado" },
  { value: "solicita_informacion", label: "Solicita información" },
  { value: "no_interesado",       label: "No interesado" },
  { value: "no_contesta",         label: "No contesta" },
  { value: "volver_a_llamar",     label: "Volver a llamar" },
  { value: "ocupado_en_reunion",  label: "Ocupado / En reunión" },
  { value: "prometio_llamar",     label: "Prometió llamar" },
  { value: "buzon_de_voz",        label: "Buzón de voz" },
  { value: "fuera_de_servicio",   label: "Fuera de servicio" },
  { value: "numero_equivocado",   label: "Número equivocado" },
  { value: "ya_tiene_proveedor",  label: "Empresa con página web" },
  { value: "baja_de_oficio",      label: "Baja de oficio" },
  { value: "suspension_temporal", label: "Suspensión temporal" },
  { value: "no_habido",           label: "No habido" },
  { value: "perdida",             label: "Venta perdida" },
];

export const COLOR_ESTADO: Record<string, string> = {
  nuevo:              "bg-blue-100 text-blue-700",
  por_gestionar:      "bg-zinc-100 text-zinc-600",
  interesado:         "bg-green-100 text-green-700",
  no_interesado:      "bg-red-100 text-red-700",
  no_contesta:        "bg-gray-100 text-gray-500",
  volver_a_llamar:    "bg-yellow-100 text-yellow-700",
  ocupado_en_reunion: "bg-yellow-100 text-yellow-700",
  prometio_llamar:    "bg-purple-100 text-purple-700",
  buzon_de_voz:       "bg-orange-100 text-orange-700",
  fuera_de_servicio:  "bg-red-100 text-red-600",
  numero_equivocado:  "bg-pink-100 text-pink-700",
  ya_tiene_proveedor:  "bg-purple-100 text-purple-700",
  baja_de_oficio:      "bg-slate-100 text-slate-600",
  solicita_informacion:"bg-sky-100 text-sky-700",
  suspension_temporal: "bg-amber-100 text-amber-700",
  no_habido:           "bg-slate-100 text-slate-500",
  perdida:             "bg-red-100 text-red-700",
};

export const COLOR_PRIORIDAD: Record<string, string> = {
  alta:  "bg-red-100 text-red-600",
  media: "bg-yellow-100 text-yellow-600",
  baja:  "bg-gray-100 text-zinc-800",
};