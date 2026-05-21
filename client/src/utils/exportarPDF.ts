/** client/src/utils/exportarPDF.ts */

import jsPDF                       from "jspdf";
import { autoTable }               from "jspdf-autotable";
import type { Metrica }            from "../types/metricas.types";
import { calcularMetricas }        from "./metricas.calc";
import type { MetricasCalculadas } from "./metricas.calc";

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  amber:  [79,  70,  229] as [number,number,number], //color principal (headers, valores, 
  dark:    [24,  24,  27 ] as [number,number,number], // fondos oscuros y texto principal
  white:   [255, 255, 255] as [number,number,number], // blanco
  gray:    [113, 113, 122] as [number,number,number], // labels y texto secundario
  zinc50:  [249, 250, 251] as [number,number,number], // filas alternas de tablas
  zinc100: [244, 244, 245] as [number,number,number], // fondos suaves (info empresa, notas)
  zinc200: [228, 228, 231] as [number,number,number], // bordes y líneas
  zinc800: [39,  39,  42 ] as [number,number,number], // header de tabla "métricas brutas"
  green:   [22,  163, 74 ] as [number,number,number], // health score
  blue:    [37,  99,  235] as [number,number,number],  // semáforo azul
  yellow:  [202, 138, 4  ] as [number,number,number], // semáforo amarillo
  red:     [220, 38,  38 ] as [number,number,number],  // semáforo rojo
  greenBg: [240, 253, 244] as [number,number,number],   // fondos de celdas 
  blueBg:  [239, 246, 255] as [number,number,number],
  yellowBg:[254, 252, 232] as [number,number,number],
  redBg:   [254, 242, 242] as [number,number,number],
};

const PLAT_COLOR: Record<string, [number,number,number]> = {
  meta:   [59,  130, 246],
  tiktok: [236, 72,  153],
  google: [239, 68,  68 ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number, dec = 0) =>
  Number(n).toLocaleString("es-PE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtS = (n: number) => `S/ ${fmt(Number(n), 2)}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

const healthColor = (color: string): [number,number,number] =>
  color === "green" ? C.green : color === "blue" ? C.blue : color === "yellow" ? C.yellow : C.red;

const semaforoColor = (estado: string): [number,number,number] =>
  estado === "green" ? C.green : estado === "yellow" ? C.yellow : C.red;

const semaforoBg = (estado: string): [number,number,number] =>
  estado === "green" ? C.greenBg : estado === "yellow" ? C.yellowBg : C.redBg;

// ── Encabezado global (portada) ───────────────────────────────────────────────
function dibujarHeader(doc: jsPDF, totalCampanas: number) {
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  doc.setFillColor(...C.dark);
  doc.rect(0, 0, W, 30, "F");

  doc.setFillColor(...C.amber);
  doc.roundedRect(M, 7, 16, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text("Z", M + 8, 18, { align: "center" });

  doc.setFontSize(14);
  doc.text("Zincel CRM", M + 22, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text("Reporte Detallado de Métricas", M + 22, 20);

  doc.setTextColor(...C.white);
  doc.setFontSize(7.5);
  const hoy = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Generado: ${hoy}`, W - M, 14, { align: "right" });
  doc.text(`${totalCampanas} campaña${totalCampanas !== 1 ? "s" : ""}`, W - M, 20, { align: "right" });
}

// ── Info empresa (portada) ────────────────────────────────────────────────────
function dibujarInfoEmpresa(doc: jsPDF, empresa: string, desde: string, hasta: string, y: number): number {
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  doc.setFillColor(...C.zinc100);
  doc.roundedRect(M, y, W - M * 2, 22, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text("ELABORADO POR", M + 5, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.amber);
  doc.text("Zincel Ideas", M + 5, y + 12);

  doc.setDrawColor(...C.zinc200);
  doc.line(W / 2, y + 4, W / 2, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text("CLIENTE", W / 2 + 5, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(empresa || "—", W / 2 + 5, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text(`Período: ${fmtDate(desde)}  →  ${fmtDate(hasta)}`, M + 5, y + 19);

  return y + 28;
}

// ── Resumen ejecutivo KPIs (portada) ──────────────────────────────────────────
function dibujarResumenEjecutivo(doc: jsPDF, metricas: Metrica[], y: number): number {
  const W = doc.internal.pageSize.getWidth();
  const M = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text("RESUMEN EJECUTIVO", M, y);
  y += 5;

  const totalGasto = metricas.reduce((s, m) => s + Number(m.gasto), 0);
  const totalLeads = metricas.reduce((s, m) => s + Number(m.leads), 0);
  const totalConv  = metricas.reduce((s, m) => s + Number(m.conversiones), 0);
  const totalImp   = metricas.reduce((s, m) => s + Number(m.impresiones), 0);
  const totalClics = metricas.reduce((s, m) => s + Number(m.clics), 0);
  const totalMsg   = metricas.reduce((s, m) => s + Number(m.mensajes), 0);
  const roasArr    = metricas.filter(m => Number(m.roas) > 0);
  const roasProm   = roasArr.length ? roasArr.reduce((s, m) => s + Number(m.roas), 0) / roasArr.length : 0;
  const cpaArr     = metricas.filter(m => Number(m.cpa) > 0);
  const cpaProm    = cpaArr.length ? cpaArr.reduce((s, m) => s + Number(m.cpa), 0) / cpaArr.length : 0;

  const kpis = [
    { label: "Gasto total",  value: fmtS(totalGasto)          },
    { label: "Leads",        value: fmt(totalLeads)            },
    { label: "Conversiones", value: fmt(totalConv)             },
    { label: "ROAS prom.",   value: `${roasProm.toFixed(2)}x`  },
    { label: "Impresiones",  value: fmt(totalImp)              },
    { label: "Clics",        value: fmt(totalClics)            },
    { label: "Mensajes",     value: fmt(totalMsg)              },
    { label: "CPA prom.",    value: fmtS(cpaProm)              },
  ];

  const boxW = (W - M * 2 - 9) / 4;
  const boxH = 18;

  kpis.forEach((kpi, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x   = M + col * (boxW + 3);
    const yy  = y + row * (boxH + 3);

    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.zinc200);
    doc.roundedRect(x, yy, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(...C.amber);
    doc.roundedRect(x, yy, boxW, 1.5, 0.5, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.amber);
    doc.text(kpi.value, x + boxW / 2, yy + 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray);
    doc.text(kpi.label, x + boxW / 2, yy + 15, { align: "center" });
  });

  return y + 2 * (boxH + 3) + 8;
}

// ── Encabezado grande de campaña ──────────────────────────────────────────────
function dibujarCampanaHeader(
  doc: jsPDF,
  m: Metrica,
  numero: number,
  c: MetricasCalculadas,
  y: number
): number {
  const W  = doc.internal.pageSize.getWidth();
  const M  = 14;
  const hc = healthColor(c.health_color);
  const pc = PLAT_COLOR[m.plataforma] ?? C.amber;

  doc.setFillColor(...C.dark);
  doc.roundedRect(M, y, W - M * 2, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text(`#${numero}`, M + 4, y + 7);

  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  const nombre = m.campana_nombre.length > 52 ? m.campana_nombre.slice(0, 50) + "…" : m.campana_nombre;
  doc.text(nombre, M + 12, y + 8);

  doc.setFillColor(...pc);
  doc.roundedRect(M + 12, y + 11, 24, 6, 1, 1, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.white);
  doc.text(
    m.plataforma.charAt(0).toUpperCase() + m.plataforma.slice(1) + " Ads",
    M + 24, y + 15.5, { align: "center" }
  );

  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`${fmtDate(m.periodo_inicio)} → ${fmtDate(m.periodo_fin)}`, M + 40, y + 15.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...hc);
  doc.text(String(c.health_score), W - M - 28, y + 13, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(...hc);
  doc.text("/ 100", W - M - 28, y + 18, { align: "right" });
  doc.setFontSize(7);
  doc.text(`Campaña ${c.health_label}`, W - M - 4, y + 13, { align: "right" });

  return y + 28;
}

// ── Encabezado mini (páginas continuación de campaña) ─────────────────────────
function dibujarMiniHeader(
  doc: jsPDF,
  m: Metrica,
  numero: number,
  seccion: string,
  y: number
): number {
  const W  = doc.internal.pageSize.getWidth();
  const M  = 14;
  const pc = PLAT_COLOR[m.plataforma] ?? C.amber;

  doc.setFillColor(...C.dark);
  doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  const nombre = m.campana_nombre.length > 52 ? m.campana_nombre.slice(0, 50) + "…" : m.campana_nombre;
  doc.text(`#${numero} · ${nombre}`, M + 4, y + 6.5);

  const badgeW = 32;
  const badgeX = W - M - badgeW;
  doc.setFillColor(...pc);
  doc.roundedRect(badgeX, y + 2, badgeW, 6, 1, 1, "F");
  doc.setFontSize(6);
  doc.setTextColor(...C.white);
  doc.text(seccion, badgeX + badgeW / 2, y + 6.5, { align: "center" });

  return y + 14;
}

// ── Sección label helper ──────────────────────────────────────────────────────
function seccionLabel(doc: jsPDF, texto: string, y: number): number {
  const M = 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text(texto, M, y);
  return y + 4;
}

// ── Página A: métricas brutas + calculadas + benchmark ────────────────────────
function dibujarCampanaMetricas(doc: jsPDF, m: Metrica, numero: number, c: MetricasCalculadas): void {
  const M = 14;

  doc.addPage();
  let y = dibujarCampanaHeader(doc, m, numero, c, 15);

  // ── Métricas brutas ──────────────────────────────────────────────────────────
  y = seccionLabel(doc, "MÉTRICAS BRUTAS", y);

  const brutas = [
    ["Gasto",              fmtS(Number(m.gasto))          ],
    ["Impresiones",        fmt(Number(m.impresiones))      ],
    ["Alcance",            fmt(Number(m.alcance))          ],
    ["Clics",              fmt(Number(m.clics))            ],
    ["Leads",              fmt(Number(m.leads))            ],
    ["Mensajes",           fmt(Number(m.mensajes))         ],
    ["Conversiones",       fmt(Number(m.conversiones))     ],
    ["Ingresos",           fmtS(Number(m.ingresos))        ],
    ["Interacciones",      fmt(Number(m.interacciones))    ],
    ["Me gusta",           fmt(Number(m.me_gusta))         ],
    ["Comentarios",        fmt(Number(m.comentarios))      ],
    ["Compartidos",        fmt(Number(m.compartidos))      ],
    ["Guardados",          fmt(Number(m.guardados))        ],
    ["Reproducciones",     fmt(Number(m.reproducciones))   ],
    ["Seguidores ganados", `+${fmt(Number(m.seguidores_ganados))}`],
    ["Visitas perfil",     fmt(Number(m.perfil_visitas))   ],
  ].filter(([, v]) => v !== "0" && v !== "+0" && v !== "S/ 0.00");

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Métrica", "Valor", "Métrica", "Valor"]],
    body: (() => {
      const rows = [];
      for (let i = 0; i < brutas.length; i += 2) {
        rows.push([
          brutas[i]?.[0]   ?? "", brutas[i]?.[1]   ?? "",
          brutas[i+1]?.[0] ?? "", brutas[i+1]?.[1] ?? "",
        ]);
      }
      return rows;
    })(),
    headStyles:         { fillColor: C.zinc800, textColor: C.white, fontStyle: "bold", fontSize: 7 },
    bodyStyles:         { fontSize: 7.5, textColor: C.dark },
    alternateRowStyles: { fillColor: C.zinc50 },
    styles:             { cellPadding: 2.5, overflow: "linebreak", font: "helvetica" },
    columnStyles: {
      1: { fontStyle: "bold", textColor: C.amber as any },
      3: { fontStyle: "bold", textColor: C.amber as any },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Métricas calculadas ──────────────────────────────────────────────────────
  y = seccionLabel(doc, "MÉTRICAS CALCULADAS", y);

  const calculadas = [
    ["CTR",             `${c.ctr}%`,                "Tasa de clic"           ],
    ["CPC",             `S/ ${c.cpc}`,              "Costo por clic"         ],
    ["CPM",             `S/ ${c.cpm}`,              "Por 1,000 imp."         ],
    ["CPA",             `S/ ${c.cpa}`,              "Costo por conv."        ],
    ["ROAS",            `${c.roas}x`,               "Retorno publicitario"   ],
    ["ROI",             `${c.roi}%`,                "Retorno total"          ],
    ["Frecuencia",      `${c.frecuencia}x`,         "Veces visto"            ],
    ["Costo/Lead",      `S/ ${c.costo_por_lead}`,   "Por lead"               ],
    ["Costo/Mensaje",   `S/ ${c.costo_por_mensaje}`,"Por mensaje"            ],
    ["Tasa conversión", `${c.tasa_conversion}%`,    "Clics → Conv."          ],
    ["Tasa cierre",     `${c.tasa_cierre}%`,        "Leads → Venta"          ],
    ["Ticket prom.",    `S/ ${c.ticket_promedio}`,  "Por venta"              ],
    ["Margen neto",     `S/ ${c.margen_neto}`,      "Ingresos - Costos"      ],
    ["Pto. equilibrio", `${c.punto_equilibrio} ventas`, "Para cubrir costos" ],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Métrica", "Valor", "Descripción", "Métrica", "Valor", "Descripción"]],
    body: (() => {
      const rows = [];
      for (let i = 0; i < calculadas.length; i += 2) {
        rows.push([
          calculadas[i]?.[0]   ?? "", calculadas[i]?.[1]   ?? "", calculadas[i]?.[2]   ?? "",
          calculadas[i+1]?.[0] ?? "", calculadas[i+1]?.[1] ?? "", calculadas[i+1]?.[2] ?? "",
        ]);
      }
      return rows;
    })(),
    headStyles:         { fillColor: C.amber, textColor: C.white, fontStyle: "bold", fontSize: 7 },
    bodyStyles:         { fontSize: 7.5, textColor: C.dark },
    alternateRowStyles: { fillColor: C.zinc50 },
    styles:             { cellPadding: 2.5, overflow: "linebreak", font: "helvetica" },
    columnStyles: {
      1: { fontStyle: "bold", textColor: C.amber as any },
      2: { textColor: C.gray as any, fontSize: 6.5 },
      4: { fontStyle: "bold", textColor: C.amber as any },
      5: { textColor: C.gray as any, fontSize: 6.5 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Evaluación vs benchmark ──────────────────────────────────────────────────
  y = seccionLabel(doc, `EVALUACIÓN VS BENCHMARK · ${m.plataforma.toUpperCase()} ADS`, y);

  const semRows = Object.entries(c.semaforos).map(([key, s]) => [
    key.toUpperCase(),
    key === "roas" || key === "frecuencia" ? `${s.valor}x`
      : key === "ctr" ? `${s.valor}%`
      : `S/ ${s.valor}`,
    s.benchmark,
    s.estado === "green" ? "ÓPTIMO" : s.estado === "yellow" ? "REGULAR" : "CRÍTICO",
    s.lectura,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["KPI", "Valor", "Benchmark", "Estado", "Interpretación"]],
    body: semRows,
    headStyles:   { fillColor: C.zinc800, textColor: C.white, fontStyle: "bold", fontSize: 7 },
    bodyStyles:   { fontSize: 7, textColor: C.dark },
    styles:       { cellPadding: 2.5, overflow: "linebreak", font: "helvetica" },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
      2: { cellWidth: 28 },
      3: { cellWidth: 20 },
      4: { cellWidth: "auto" as any },
    },
    didDrawCell: (data: any) => {
      if (data.section === "body" && data.column.index === 3) {
        const estado = Object.values(c.semaforos)[data.row.index]?.estado;
        if (!estado) return;
        doc.setFillColor(...semaforoBg(estado));
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...semaforoColor(estado));
        doc.text(
          data.cell.raw as string,
          data.cell.x + data.cell.width / 2,
          data.cell.y + data.cell.height / 2 + 2,
          { align: "center" }
        );
      }
    },
  });
}

// ── Página B: proyección + recomendaciones ────────────────────────────────────
function dibujarCampanaRecomendaciones(
  doc: jsPDF,
  m: Metrica,
  numero: number,
  c: MetricasCalculadas
): void {
  const W = doc.internal.pageSize.getWidth();
  const M = 14;
  const textColW = W - M * 2 - 12;

  doc.addPage();
  let y = dibujarMiniHeader(doc, m, numero, "PROYECCIÓN Y RECOMENDACIONES", 12);

  // ── Proyección a 30 días ──────────────────────────────────────────────────────
  y = seccionLabel(doc, "PROYECCIÓN A 30 DÍAS (si mantienes el ritmo actual)", y);

  const p = c.proyeccion;
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Gasto proyectado", "Leads proyectados", "Ingresos proyectados", "ROAS proyectado", "Presupuesto recomendado (+20%)"]],
    body: [[
      fmtS(p.gasto_proyectado),
      fmt(p.leads_proyectados),
      fmtS(p.ingresos_proyectados),
      `${Number(p.roas_proyectado).toFixed(2)}x`,
      fmtS(p.presupuesto_meta),
    ]],
    headStyles: { fillColor: C.amber, textColor: C.white, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 9, fontStyle: "bold", textColor: C.amber, halign: "center" },
    styles:     { cellPadding: 4, overflow: "linebreak", font: "helvetica" },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Recomendaciones ───────────────────────────────────────────────────────────
  y = seccionLabel(doc, "RECOMENDACIONES", y);

  const recomendaciones: string[] = [];

  if (c.health_color === "green") {
    recomendaciones.push(
      `La campaña está en rendimiento óptimo (score ${c.health_score}/100). ` +
      `Considera incrementar el presupuesto un 20-30% para escalar resultados. ` +
      `Presupuesto sugerido: ${fmtS(p.presupuesto_meta)}/mes.`
    );
  } else if (c.health_color === "blue") {
    recomendaciones.push(
      `La campaña tiene buen rendimiento (score ${c.health_score}/100) con oportunidades de mejora. ` +
      `Optimiza las métricas en estado Regular para alcanzar rendimiento óptimo.`
    );
  } else if (c.health_color === "yellow") {
    recomendaciones.push(
      `La campaña necesita optimización (score ${c.health_score}/100). ` +
      `Revisa las métricas marcadas como Críticas. ` +
      `Considera ajustar la segmentación y rotar creatividades.`
    );
  } else {
    recomendaciones.push(
      `Campaña en estado crítico (score ${c.health_score}/100). ` +
      `Se recomienda pausarla y revisar completamente la segmentación y creatividades antes de continuar invirtiendo.`
    );
  }

  const sems = c.semaforos;
  if (sems.ctr?.estado === "red")
    recomendaciones.push(
      `CTR bajo (${sems.ctr.valor}%): el anuncio no está generando suficientes clics. ` +
      `Prueba nuevas creatividades, cambia el copy o ajusta la audiencia objetivo.`
    );
  if (sems.cpm?.estado === "red")
    recomendaciones.push(
      `CPM alto (S/ ${sems.cpm.valor}): la audiencia puede estar saturada o la competencia es elevada. ` +
      `Considera ampliar o cambiar el público objetivo para reducir el costo por mil impresiones.`
    );
  if (sems.cpc?.estado === "red")
    recomendaciones.push(
      `CPC alto (S/ ${sems.cpc.valor}): cada clic tiene un costo elevado. ` +
      `Mejora la relevancia del anuncio y revisa la segmentación para atraer clics de mayor calidad.`
    );
  if (sems.cpa?.estado === "red")
    recomendaciones.push(
      `CPA alto (S/ ${sems.cpa.valor}): el costo por conversión supera el benchmark. ` +
      `Revisa el proceso de conversión en la landing page y simplifica el flujo de compra.`
    );
  if (sems.roas?.estado === "red")
    recomendaciones.push(
      `ROAS bajo (${sems.roas.valor}x): la campaña no está siendo rentable. ` +
      `Aumenta el precio de venta promedio o reduce el gasto hasta optimizar la segmentación.`
    );
  if (sems.frecuencia?.estado === "red")
    recomendaciones.push(
      `Frecuencia alta (${sems.frecuencia.valor}x): la audiencia está viendo el anuncio demasiadas veces. ` +
      `Rota las creatividades y amplía el público objetivo para reducir la saturación.`
    );

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    body: recomendaciones.map((r, i) => [`${i + 1}.`, r]),
    bodyStyles: {
      fontSize: 8,
      textColor: C.dark,
      valign: "top",
    },
    alternateRowStyles: { fillColor: C.zinc50 },
    styles: {
      cellPadding: 4,
      overflow: "linebreak",
      font: "helvetica",
      lineColor: C.zinc200,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", textColor: C.amber as any, halign: "center" },
      1: { cellWidth: textColW },
    },
  });

  // ── Notas ─────────────────────────────────────────────────────────────────────
  if (m.notas) {
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFillColor(...C.zinc100);
    doc.roundedRect(M, y, W - M * 2, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text("NOTAS:", M + 4, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    const notas = doc.splitTextToSize(m.notas, W - M * 2 - 26);
    doc.text(notas[0] ?? "", M + 20, y + 5.5);
    if (notas[1]) doc.text(notas[1], M + 20, y + 11);
  }
}

// ── Por campaña: llama a ambas páginas ────────────────────────────────────────
function dibujarCampana(doc: jsPDF, m: Metrica, numero: number): void {
  const c = calcularMetricas(m);
  dibujarCampanaMetricas(doc, m, numero, c);
  dibujarCampanaRecomendaciones(doc, m, numero, c);
}

// ── Página de cierre ──────────────────────────────────────────────────────────
function dibujarPaginaCierre(doc: jsPDF, empresa: string) {
  const W  = doc.internal.pageSize.getWidth();
  const H  = doc.internal.pageSize.getHeight();
  const cx = W / 2;

  doc.addPage();

  doc.setFillColor(...C.dark);
  doc.rect(0, 0, W, H * 0.55, "F");

  doc.setFillColor(...C.zinc50);
  doc.rect(0, H * 0.55, W, H * 0.45, "F");

  doc.setFillColor(...C.amber);
  doc.rect(0, H * 0.55 - 2, W, 4, "F");

  // Logo Z
  const logoSize = 22;
  const logoY    = 44;
  doc.setFillColor(...C.amber);
  doc.roundedRect(cx - logoSize / 2, logoY, logoSize, logoSize, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...C.white);
  doc.text("Z", cx, logoY + 14.5, { align: "center" });

  // Nombre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C.white);
  doc.text("Zincel Ideas Globales", cx, logoY + 34, { align: "center" });

  // Servicios
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text(
    "Desarrollo web  |  Branding  |  Modelamiento 3D  |  Marketing digital",
    cx, logoY + 43, { align: "center" }
  );

  // Divisor
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(0.5);
  doc.line(cx - 30, logoY + 50, cx + 30, logoY + 50);

  // Mensaje
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.white);
  doc.text("Gracias por confiar en Zincel Ideas", cx, logoY + 60, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  const cliente = empresa ? `para ${empresa}` : "";
  doc.text(`Este reporte fue elaborado ${cliente} con datos reales de tus campañas.`, cx, logoY + 68, { align: "center" });
  doc.text("Estamos disponibles para revisar resultados y planificar la siguiente etapa.", cx, logoY + 75, { align: "center" });

  // Contacto
  const cy2 = H * 0.55 + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text("CONTACTO", cx, cy2, { align: "center" });

  const cards = [
    { icon: "@", label: "Email",    value: "kenif.alejandro@zincelideas.com" },
    { icon: "W", label: "Web",      value: "zincelideas.com"                 },
    { icon: "f", label: "Facebook", value: "zincelideas"                     },
  ];

  const cardW = 52;
  const cardH = 18;
  const gap   = 5;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = cx - totalW / 2;

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const cardY = cy2 + 5;

    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.zinc200);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "FD");

    doc.setFillColor(...C.amber);
    doc.circle(x + 8, cardY + cardH / 2, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.white);
    doc.text(card.icon, x + 8, cardY + cardH / 2 + 2, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.gray);
    doc.text(card.label, x + 14, cardY + cardH / 2 - 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.dark);
    doc.text(card.value, x + 14, cardY + cardH / 2 + 5);
  });

  // Fecha y disclaimer
  const disclaimerY = cy2 + cardH + 18;
  const hoy = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.amber);
  doc.text(`Reporte generado el ${hoy}`, cx, disclaimerY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray);
  doc.text(
    "Este documento es de uso confidencial. Los datos corresponden al período indicado",
    cx, disclaimerY + 7, { align: "center" }
  );
  doc.text(
    "y no deben ser compartidos sin autorización previa.",
    cx, disclaimerY + 12, { align: "center" }
  );

  // Copyright bar
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 185);
  doc.text(`© ${new Date().getFullYear()} Zincel Ideas Globales · Todos los derechos reservados`, cx, H - 12, { align: "center" });
  doc.setFillColor(...C.amber);
  doc.rect(0, H - 6, W, 6, "F");
}

// ── Footer en todas las páginas ───────────────────────────────────────────────
function dibujarFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const W     = doc.internal.pageSize.getWidth();
  const pH    = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.zinc100);
    doc.rect(0, pH - 9, W, 9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.gray);
    doc.text("Zincel CRM · Reporte generado automáticamente", 14, pH - 3);
    doc.text(`Página ${i} de ${pages}`, W - 14, pH - 3, { align: "right" });
  }
}

// ── Export principal ──────────────────────────────────────────────────────────
export function exportarReportePDF(metricas: Metrica[], empresa: string) {
  if (!metricas.length) return;

  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const M     = 14;
  const desde = [...metricas].sort((a, b) => a.periodo_inicio.localeCompare(b.periodo_inicio))[0].periodo_inicio;
  const hasta = [...metricas].sort((a, b) => b.periodo_fin.localeCompare(a.periodo_fin))[0].periodo_fin;

  // ── Página 1: Resumen ejecutivo ───────────────────────────────────────────────
  dibujarHeader(doc, metricas.length);
  let y = dibujarInfoEmpresa(doc, empresa, desde, hasta, 36);
  y     = dibujarResumenEjecutivo(doc, metricas, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text("CAMPAÑAS INCLUIDAS EN ESTE REPORTE", M, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["#", "Campaña", "Plataforma", "Período", "Gasto", "Leads", "ROAS", "Score"]],
    body: metricas.map((m, i) => {
      const calc = calcularMetricas(m);
      return [
        i + 1,
        m.campana_nombre.length > 35 ? m.campana_nombre.slice(0, 33) + "…" : m.campana_nombre,
        m.plataforma.charAt(0).toUpperCase() + m.plataforma.slice(1),
        `${fmtDate(m.periodo_inicio)} → ${fmtDate(m.periodo_fin)}`,
        fmtS(Number(m.gasto)),
        fmt(Number(m.leads)),
        `${Number(m.roas).toFixed(2)}x`,
        `${calc.health_score}/100`,
      ];
    }),
    headStyles:         { fillColor: C.amber, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
    bodyStyles:         { fontSize: 7.5, textColor: C.dark },
    alternateRowStyles: { fillColor: C.zinc50 },
    styles:             { cellPadding: 2.5, overflow: "linebreak", font: "helvetica" },
  });

  // ── Páginas por campaña (2 páginas cada una) ──────────────────────────────────
  metricas.forEach((m, i) => dibujarCampana(doc, m, i + 1));

  // ── Página de cierre ──────────────────────────────────────────────────────────
  dibujarPaginaCierre(doc, empresa);

  // ── Footers en todas las páginas ─────────────────────────────────────────────
  dibujarFooters(doc);

  const slug  = empresa ? empresa.replace(/\s+/g, "_").toLowerCase() : "metricas";
  const fecha = new Date().toISOString().split("T")[0];
  doc.save(`reporte_${slug}_${fecha}.pdf`);
}
