import React, { useState, useMemo } from 'react';

// ─── Tasas de blanco/nulo (ONPE 09:38am 08/06/2026) ────────────────────────
const TASA_BLANCO = 0.00596;
const TASA_NULO   = 0.05951;
const TASA_VALIDO = 1 - TASA_BLANCO - TASA_NULO; // 0.93453

// ─── Snapshot real ONPE 09:38am — 93.181 % actas ───────────────────────────
const REAL = {
  pct:                  93.181,
  actasContabilizadas:  86440,
  actasJee:             1512,
  actasPendientes:      4814,
  actasTotal:           92766,
  keikoVotos:           8756646,
  keikoValidosPct:      50.069,
  keikoEmitidosPct:     46.791,
  sanchezVotos:         8732482,
  sanchezValidosPct:    49.931,
  sanchezEmitidosPct:   46.662,
  blancoVotos:          111529,
  blancoPct:            0.596,
  nuloVotos:            1113649,
  nuloPct:              5.951,
  totalValidos:         17489128,
  totalEmitidos:        18714306,
};

// ─── Proyección al 100 % ────────────────────────────────────────────────────
// Anclada a conteos rápidos integrales publicados el 07/06/2026:
//   • IPSOS / Transparencia / NDI : Sánchez 50.3% — Keiko 49.7%  (±1.9 pp)
//   • Datum Internacional         : Sánchez 50.14% — Keiko 49.86% (±1.0 pp)
// Se usa IPSOS como referencia (acertó en 1ª vuelta). ~19.5M votos válidos
// estimados (210.25 válidos/acta × 92,766 actas totales).
// Punto de quiebre calculado: Sánchez supera a Keiko al ~95.5% de actas.
const EXTRAN_VOTOS  = 537998;
const EXTRAN_KEIKO  = Math.round(EXTRAN_VOTOS * 0.65); // 349,699
const EXTRAN_SANCH  = Math.round(EXTRAN_VOTOS * 0.35); // 188,299
const KEIKO_100   = 9692700;   // 49.7% de ~19.5M válidos · IPSOS/Transparencia
const SANCHEZ_100 = 9809700;   // 50.3% de ~19.5M válidos · IPSOS/Transparencia
const TOTAL_VALIDOS_100  = KEIKO_100 + SANCHEZ_100;
const TOTAL_EMITIDOS_100 = Math.round(TOTAL_VALIDOS_100 / TASA_VALIDO);

// ─── Interface ─────────────────────────────────────────────────────────────
interface Region {
  id: string;
  nombre: string;
  pctContado: number;
  actasTotal: number;
  actasContabilizadas: number;
  actasJee: number;
  actasPendientes: number;
  keikoPct: number;
  keikoVotos: number;
  sanchezPct: number;
  sanchezVotos: number;
  nota?: string;
}

// ─── Datos por región (proyección 100 %) ───────────────────────────────────
const REGIONES: Region[] = [
  {
    id: 'todos', nombre: 'TODOS',
    pctContado: REAL.pct, actasTotal: REAL.actasTotal,
    actasContabilizadas: REAL.actasContabilizadas, actasJee: REAL.actasJee, actasPendientes: REAL.actasPendientes,
    keikoPct: parseFloat((KEIKO_100 / TOTAL_VALIDOS_100 * 100).toFixed(3)),
    keikoVotos: KEIKO_100,
    sanchezPct: parseFloat((SANCHEZ_100 / TOTAL_VALIDOS_100 * 100).toFixed(3)),
    sanchezVotos: SANCHEZ_100,
  },
  { id: 'amazonas',    nombre: 'AMAZONAS',       pctContado: 88.341, actasTotal: 1278,  actasContabilizadas: 1129,  actasJee: 13, actasPendientes: 136,   keikoPct: 37.638, keikoVotos: 67506,   sanchezPct: 62.362, sanchezVotos: 111848 },
  { id: 'ancash',      nombre: 'ÁNCASH',          pctContado: 98.646, actasTotal: 3472,  actasContabilizadas: 3425,  actasJee: 47, actasPendientes: 0,     keikoPct: 43.400, keikoVotos: 267408,  sanchezPct: 56.600, sanchezVotos: 348735 },
  { id: 'apurimac',    nombre: 'APURÍMAC',        pctContado: 99.013, actasTotal: 1317,  actasContabilizadas: 1304,  actasJee: 10, actasPendientes: 3,     keikoPct: 18.841, keikoVotos: 43080,   sanchezPct: 81.159, sanchezVotos: 185573 },
  { id: 'arequipa',    nombre: 'AREQUIPA',        pctContado: 99.193, actasTotal: 4215,  actasContabilizadas: 4181,  actasJee: 25, actasPendientes: 9,     keikoPct: 36.426, keikoVotos: 332142,  sanchezPct: 63.574, sanchezVotos: 579681 },
  { id: 'ayacucho',    nombre: 'AYACUCHO',        pctContado: 87.526, actasTotal: 1900,  actasContabilizadas: 1663,  actasJee: 17, actasPendientes: 220,   keikoPct: 20.966, keikoVotos: 60855,   sanchezPct: 79.034, sanchezVotos: 229399 },
  { id: 'cajamarca',   nombre: 'CAJAMARCA',       pctContado: 99.292, actasTotal: 4240,  actasContabilizadas: 4210,  actasJee: 30, actasPendientes: 0,     keikoPct: 33.243, keikoVotos: 244352,  sanchezPct: 66.757, sanchezVotos: 490702 },
  { id: 'callao',      nombre: 'CALLAO',          pctContado: 97.619, actasTotal: 2898,  actasContabilizadas: 2829,  actasJee: 69, actasPendientes: 0,     keikoPct: 65.606, keikoVotos: 394407,  sanchezPct: 34.394, sanchezVotos: 206765 },
  { id: 'cusco',       nombre: 'CUSCO',           pctContado: 91.213, actasTotal: 3983,  actasContabilizadas: 3633,  actasJee: 43, actasPendientes: 307,   keikoPct: 22.179, keikoVotos: 156624,  sanchezPct: 77.821, sanchezVotos: 549548 },
  { id: 'huancavelica',nombre: 'HUANCAVELICA',    pctContado: 92.459, actasTotal: 1273,  actasContabilizadas: 1177,  actasJee: 11, actasPendientes: 85,    keikoPct: 18.547, keikoVotos: 34408,   sanchezPct: 81.453, sanchezVotos: 151114 },
  { id: 'huanuco',     nombre: 'HUÁNUCO',         pctContado: 95.899, actasTotal: 2341,  actasContabilizadas: 2245,  actasJee: 20, actasPendientes: 76,    keikoPct: 35.939, keikoVotos: 136331,  sanchezPct: 64.061, sanchezVotos: 243010 },
  { id: 'ica',         nombre: 'ICA',             pctContado: 99.099, actasTotal: 2443,  actasContabilizadas: 2421,  actasJee: 22, actasPendientes: 0,     keikoPct: 51.911, keikoVotos: 279728,  sanchezPct: 48.089, sanchezVotos: 259131 },
  { id: 'junin',       nombre: 'JUNÍN',           pctContado: 97.507, actasTotal: 3691,  actasContabilizadas: 3599,  actasJee: 32, actasPendientes: 60,    keikoPct: 45.085, keikoVotos: 317670,  sanchezPct: 54.915, sanchezVotos: 386933 },
  { id: 'lalibertad',  nombre: 'LA LIBERTAD',     pctContado: 99.283, actasTotal: 5302,  actasContabilizadas: 5264,  actasJee: 38, actasPendientes: 0,     keikoPct: 57.534, keikoVotos: 599711,  sanchezPct: 42.466, sanchezVotos: 442641 },
  { id: 'lambayeque',  nombre: 'LAMBAYEQUE',      pctContado: 99.582, actasTotal: 3590,  actasContabilizadas: 3575,  actasJee: 15, actasPendientes: 0,     keikoPct: 58.849, keikoVotos: 435552,  sanchezPct: 41.151, sanchezVotos: 304561 },
  { id: 'lima',        nombre: 'LIMA',            pctContado: 96.841, actasTotal: 29247, actasContabilizadas: 28323, actasJee: 924,actasPendientes: 0,     keikoPct: 63.500, keikoVotos: 3943082, sanchezPct: 36.500, sanchezVotos: 2266534 },
  { id: 'loreto',      nombre: 'LORETO',          pctContado: 61.216, actasTotal: 2697,  actasContabilizadas: 1651,  actasJee: 23, actasPendientes: 1023,  keikoPct: 55.716, keikoVotos: 162370,  sanchezPct: 44.284, sanchezVotos: 129056 },
  { id: 'madrededios', nombre: 'MADRE DE DIOS',   pctContado: 85.799, actasTotal: 507,   actasContabilizadas: 435,   actasJee: 4,  actasPendientes: 68,    keikoPct: 32.197, keikoVotos: 27069,   sanchezPct: 67.803, sanchezVotos: 57004 },
  { id: 'moquegua',    nombre: 'MOQUEGUA',        pctContado: 99.654, actasTotal: 578,   actasContabilizadas: 576,   actasJee: 2,  actasPendientes: 0,     keikoPct: 27.431, keikoVotos: 33353,   sanchezPct: 72.569, sanchezVotos: 88235 },
  { id: 'pasco',       nombre: 'PASCO',           pctContado: 95.511, actasTotal: 802,   actasContabilizadas: 766,   actasJee: 13, actasPendientes: 23,    keikoPct: 38.833, keikoVotos: 49219,   sanchezPct: 61.167, sanchezVotos: 77527 },
  { id: 'piura',       nombre: 'PIURA',           pctContado: 98.712, actasTotal: 5281,  actasContabilizadas: 5213,  actasJee: 68, actasPendientes: 0,     keikoPct: 56.953, keikoVotos: 581730,  sanchezPct: 43.047, sanchezVotos: 439700 },
  { id: 'puno',        nombre: 'PUNO',            pctContado: 98.558, actasTotal: 3397,  actasContabilizadas: 3348,  actasJee: 25, actasPendientes: 24,    keikoPct: 13.515, keikoVotos: 94594,   sanchezPct: 86.485, sanchezVotos: 605323 },
  { id: 'sanmartin',   nombre: 'SAN MARTÍN',      pctContado: 96.764, actasTotal: 2534,  actasContabilizadas: 2452,  actasJee: 12, actasPendientes: 70,    keikoPct: 45.762, keikoVotos: 215050,  sanchezPct: 54.238, sanchezVotos: 254883 },
  { id: 'tacna',       nombre: 'TACNA',           pctContado: 98.655, actasTotal: 1041,  actasContabilizadas: 1027,  actasJee: 14, actasPendientes: 0,     keikoPct: 28.653, keikoVotos: 65388,   sanchezPct: 71.347, sanchezVotos: 162820 },
  { id: 'tumbes',      nombre: 'TUMBES',          pctContado: 99.367, actasTotal: 632,   actasContabilizadas: 628,   actasJee: 4,  actasPendientes: 0,     keikoPct: 64.338, keikoVotos: 81699,   sanchezPct: 35.662, sanchezVotos: 45285 },
  { id: 'ucayali',     nombre: 'UCAYALI',         pctContado: 87.340, actasTotal: 1564,  actasContabilizadas: 1366,  actasJee: 31, actasPendientes: 167,   keikoPct: 53.372, keikoVotos: 133318,  sanchezPct: 46.628, sanchezVotos: 116474 },
  {
    id: 'extranjero', nombre: 'EXTRANJERO',
    pctContado: 0, actasTotal: 2543, actasContabilizadas: 0, actasJee: 0, actasPendientes: 2543,
    keikoPct: 65, keikoVotos: EXTRAN_KEIKO,
    sanchezPct: 35, sanchezVotos: EXTRAN_SANCH,
    nota: 'Sin datos reales (0% contado) — estimado 65/35 Keiko/Sánchez (patrón pro-derecha, referencia 2021)',
  },
];

// ─── Zonas del conteo ─────────────────────────────────────────────────────
type EscenarioVal = 'actual' | number;
type Zona = 'actual' | 'keiko' | 'mixto' | 'sanchez';

function getZona(val: EscenarioVal): Zona {
  if (val === 'actual') return 'actual';
  const n = val as number;
  if (n <= 74) return 'keiko';
  if (n <= 79) return 'mixto';
  return 'sanchez';
}

const ZONA_CONFIG: Record<Zona, { border: string; bg: string; emoji: string; texto: string; desc: string }> = {
  actual:  { border: '#2a45a8', bg: '#1a2d7a', emoji: '📊', texto: 'Datos reales ONPE',              desc: '' },
  keiko:   { border: '#2a6fdb', bg: '#1a2d7a', emoji: '🔵', texto: 'Lima y costa dominan el conteo', desc: 'Keiko gana terreno en cada batch' },
  mixto:   { border: '#f59e0b', bg: '#2a1a00', emoji: '🟠', texto: 'Zona de transición',              desc: 'Lima termina, sierra empieza a pesar' },
  sanchez: { border: '#ef4444', bg: '#2a0000', emoji: '🔴', texto: 'Sierra y selva dominan el conteo',desc: 'Sánchez recorta — cruza al frente cerca del 95%' },
};

const ZONA_LABEL: Record<Zona, string> = {
  actual:  '',
  keiko:   '🔵 ',
  mixto:   '🟠 ',
  sanchez: '🔴 ',
};

// ─── Opciones dropdowns ────────────────────────────────────────────────────
const ESCENARIO_OPTS: { label: string; value: EscenarioVal }[] = [
  { label: `Actual (${REAL.pct.toFixed(1)}%)`, value: 'actual' },
  ...Array.from({ length: 7 }, (_, i) => {
    const p  = i + 94;
    const z  = getZona(p) as Exclude<Zona, 'actual'>;
    const lbl = p === 100
      ? `${ZONA_LABEL[z]}100% — Resultado final proyectado`
      : `${ZONA_LABEL[z]}${p}%`;
    return { label: lbl, value: p };
  }),
];

const ERROR_OPTS = [
  { label: 'Sin ajuste (0%)', value: 0 },
  { label: '± 1% — Error leve', value: 1 },
  { label: '± 2% — Error moderado', value: 2 },
  { label: '± 3% — Error significativo', value: 3 },
  { label: '± 4% — Error alto', value: 4 },
  { label: '± 5% — Error máximo', value: 5 },
];

// ─── Formateador estilo ONPE ───────────────────────────────────────────────
function fv(n: number): string {
  const r = Math.round(n);
  if (r >= 1_000_000) {
    const m = Math.floor(r / 1_000_000);
    const rest = (r % 1_000_000).toString().padStart(6, '0');
    return `${m}'${rest.slice(0, 3)},${rest.slice(3)}`;
  }
  if (r >= 1_000) {
    const t = Math.floor(r / 1_000);
    return `${t},${(r % 1_000).toString().padStart(3, '0')}`;
  }
  return r.toString();
}

// ─── Colores ───────────────────────────────────────────────────────────────
const NAVY       = '#0f1e5c';
const NAVY_DARK  = '#0a1540';
const NAVY_LIGHT = '#1a2d7a';
const NAVY_BRD   = '#2a45a8';
const KEIKO_C    = '#d94f1e';
const SANCHEZ_C  = '#1e7a3f';

function Avatar({ initials, color, size }: { initials: string; color: string; size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.28, color: 'white', border: `${Math.max(2, size * 0.035)}px solid rgba(255,255,255,0.9)`, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', letterSpacing: '-1px', margin: '0 auto' }}>
      {initials}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function SegundaVueltaPage() {
  const [selectedId,  setSelectedId]  = useState<string>('todos');
  const [escenario,   setEscenario]   = useState<EscenarioVal>('actual');
  const [margenError, setMargenError] = useState(0);

  const region   = REGIONES.find(r => r.id === selectedId) ?? REGIONES[0];
  const isGlobal = selectedId === 'todos';

  // ── Cálculo: interpolación + margen de error ──────────────────────────
  const interp = useMemo(() => {
    // 1. Interpolar entre real actual y proyección 100%
    const factor = escenario === 'actual'
      ? 0
      : (escenario - REAL.pct) / (100 - REAL.pct);

    const kRaw   = Math.round(REAL.keikoVotos   + factor * (KEIKO_100   - REAL.keikoVotos));
    const sRaw   = Math.round(REAL.sanchezVotos  + factor * (SANCHEZ_100 - REAL.sanchezVotos));
    const totRaw = kRaw + sRaw;

    // 2. Margen de error: traslada X% de votos válidos de Keiko → Sánchez
    const errorVotos = Math.round((margenError / 100) * totRaw);
    const kV  = Math.max(0, kRaw - errorVotos);
    const sV  = sRaw + errorVotos;
    const tot = kV + sV;
    const totE = Math.round(tot / TASA_VALIDO);

    const displayPct = escenario === 'actual' ? REAL.pct : escenario as number;
    const actasCont  = Math.round(REAL.actasTotal * displayPct / 100);
    const actasPend  = Math.max(0, REAL.actasTotal - actasCont - REAL.actasJee);

    // Punto de quiebre: el margen actual / 2 = error mínimo para voltear
    const margenPP     = kRaw / totRaw * 100 - sRaw / totRaw * 100;
    const breakevenPct = margenPP / 2;

    return {
      factor,
      keikoVotos:       kV,
      sanchezVotos:     sV,
      totalValidos:     tot,
      totalEmitidos:    totE,
      blancoVotos:      Math.round(totE * TASA_BLANCO),
      nuloVotos:        Math.round(totE * TASA_NULO),
      keikoPct:         kV / tot * 100,
      sanchezPct:       sV / tot * 100,
      keikoEmitPct:     kV  / totE * 100,
      sanchezEmitPct:   sV  / totE * 100,
      keikoBaseVotos:   kRaw,
      sanchezBaseVotos: sRaw,
      keikoBasePct:     kRaw / totRaw * 100,
      sanchezBasePct:   sRaw / totRaw * 100,
      diferencia:       Math.abs(kV - sV),
      keikoWins:        kV >= sV,
      displayPct,
      actasContab:      actasCont,
      actasPendientes:  actasPend,
      breakevenPct,
      errorVotos,
      margenPP,
    };
  }, [escenario, margenError]);

  // ── Derivados para la vista ───────────────────────────────────────────
  const keikoWins  = isGlobal ? interp.keikoWins : region.keikoPct >= region.sanchezPct;
  const diferencia = isGlobal ? interp.diferencia : Math.abs(region.keikoVotos - region.sanchezVotos);

  const leftPct    = isGlobal ? (interp.keikoWins ? interp.keikoPct   : interp.sanchezPct) : (keikoWins ? region.keikoPct   : region.sanchezPct);
  const rightPct   = isGlobal ? (interp.keikoWins ? interp.sanchezPct : interp.keikoPct)   : (keikoWins ? region.sanchezPct : region.keikoPct);
  const leftVotos  = isGlobal ? (interp.keikoWins ? interp.keikoVotos : interp.sanchezVotos) : (keikoWins ? region.keikoVotos   : region.sanchezVotos);
  const rightVotos = isGlobal ? (interp.keikoWins ? interp.sanchezVotos : interp.keikoVotos) : (keikoWins ? region.sanchezVotos : region.keikoVotos);

  const leftData  = keikoWins
    ? { nombre: 'KEIKO SOFIA FUJIMORI HIGUCHI',     partido: 'FUERZA POPULAR',     color: KEIKO_C,   initials: 'KF', sigla: 'K' }
    : { nombre: 'ROBERTO HELBERT SANCHEZ PALOMINO', partido: 'JUNTOS POR EL PERÚ', color: SANCHEZ_C, initials: 'RS', sigla: 'JP' };
  const rightData = keikoWins
    ? { nombre: 'ROBERTO HELBERT SANCHEZ PALOMINO', partido: 'JUNTOS POR EL PERÚ', color: SANCHEZ_C, initials: 'RS', sigla: 'JP' }
    : { nombre: 'KEIKO SOFIA FUJIMORI HIGUCHI',     partido: 'FUERZA POPULAR',     color: KEIKO_C,   initials: 'KF', sigla: 'K' };

  const actasPct      = isGlobal ? interp.displayPct      : region.pctContado;
  const actasContab   = isGlobal ? interp.actasContab     : region.actasContabilizadas;
  const actasPendShow = isGlobal ? interp.actasPendientes : region.actasPendientes;
  const actasJeeShow  = isGlobal ? REAL.actasJee          : region.actasJee;

  const isEscenarioHipo = isGlobal && escenario !== 'actual';
  const isErrorActive   = isGlobal && margenError > 0;
  const isFlipped       = isGlobal && margenError > 0 && !interp.keikoWins;
  const almostFlip      = isGlobal && margenError > 0 && interp.keikoWins && (interp.keikoPct - interp.sanchezPct) < 1;
  const zona            = getZona(escenario);
  const zonaConf        = ZONA_CONFIG[zona];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: NAVY, color: 'white', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: NAVY_DARK, borderBottom: `2px solid ${NAVY_BRD}`, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: '#7a9fff', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Segunda Elección Presidencial</div>
          <div style={{ fontSize: 12, color: '#aac3ff' }}>7 de Junio de 2026</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ backgroundColor: '#b84a00', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          ★ PROYECCIÓN AL 100 % — No oficial
        </div>
      </div>

      <div style={{ padding: '14px 28px 0' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#d0dcff' }}>Elección de Fórmula Presidencial — PROYECCIÓN</p>
      </div>

      {/* ── BARRA ACTAS ──────────────────────────────────────────────── */}
      <div style={{ margin: '12px 28px', backgroundColor: NAVY_DARK, borderRadius: 10, padding: '14px 18px', border: `1px solid ${NAVY_BRD}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#7a9fff', marginBottom: 2 }}>
              {isEscenarioHipo ? `Escenario hipotético — ${escenario}% actas` : 'Actas contabilizadas (snapshot)'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{actasPct.toFixed(3)} %</div>
          </div>
          <div style={{ fontSize: 13, color: '#7a9fff' }}>
            Total de actas: <strong style={{ color: 'white' }}>{fv(region.actasTotal)}</strong>
          </div>
        </div>
        <div style={{ position: 'relative', backgroundColor: NAVY_LIGHT, borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${actasPct}%`, backgroundColor: '#2a6fdb', transition: 'width 0.4s ease' }} />
          <div style={{ position: 'absolute', left: `${actasPct}%`, top: 0, height: '100%', width: `${(actasJeeShow / REAL.actasTotal) * 100}%`, backgroundColor: '#6aabff' }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: '#7a9fff', flexWrap: 'wrap' }}>
          <span><span style={{ color: '#2a6fdb' }}>●</span> Contabilizadas ({fv(actasContab)})</span>
          <span><span style={{ color: '#6aabff' }}>●</span> Para envío al JEE ({fv(actasJeeShow)})</span>
          <span><span style={{ color: '#3a4a7a' }}>○</span> Pendientes ({fv(actasPendShow)})</span>
        </div>
      </div>

      {/* ── CONTROLES ────────────────────────────────────────────────── */}
      <div style={{ margin: '0 28px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Región */}
        <span style={{ fontSize: 18 }}>📍</span>
        <div style={{ position: 'relative' }}>
          <select value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setEscenario('actual'); setMargenError(0); }}
            style={{ appearance: 'none', backgroundColor: NAVY_LIGHT, color: 'white', border: `1px solid ${NAVY_BRD}`, borderRadius: 8, padding: '8px 36px 8px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minWidth: 220 }}>
            {REGIONES.map(r => (
              <option key={r.id} value={r.id} style={{ backgroundColor: NAVY_LIGHT }}>
                {r.id === 'todos' ? 'PERÚ ▸ TODOS' : `PERÚ ▸ ${r.nombre}`}
              </option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10 }}>▼</span>
        </div>

        {/* Escenario de conteo — solo TODOS */}
        {isGlobal && (
          <>
            <span style={{ fontSize: 13, color: zonaConf.border }}>📊</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ position: 'relative' }}>
                <select
                  value={escenario === 'actual' ? 'actual' : String(escenario)}
                  onChange={e => { setEscenario(e.target.value === 'actual' ? 'actual' : Number(e.target.value)); setMargenError(0); }}
                  style={{ appearance: 'none', backgroundColor: zonaConf.bg, color: 'white', border: `2px solid ${zonaConf.border}`, borderRadius: 8, padding: '8px 36px 8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minWidth: 240, transition: 'all 0.3s' }}>
                  {ESCENARIO_OPTS.map(o => {
                    const z = getZona(o.value);
                    const optBg = z === 'keiko' ? '#0a1540' : z === 'mixto' ? '#1a0e00' : z === 'sanchez' ? '#1a0000' : '#0a1540';
                    return (
                      <option key={String(o.value)} value={String(o.value)} style={{ backgroundColor: optBg }}>{o.label}</option>
                    );
                  })}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10 }}>▼</span>
              </div>
              {/* Badge de zona */}
              {isEscenarioHipo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, backgroundColor: zonaConf.bg, border: `1px solid ${zonaConf.border}`, fontSize: 10, fontWeight: 700, color: zonaConf.border, transition: 'all 0.3s' }}>
                  <span>{zonaConf.emoji}</span>
                  <span>{zonaConf.texto}</span>
                  {zonaConf.desc && <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>— {zonaConf.desc}</span>}
                </div>
              )}
            </div>
          </>
        )}

        {/* Margen de error — solo TODOS */}
        {isGlobal && (
          <>
            <span style={{ fontSize: 13, color: isErrorActive ? '#ff9a7a' : '#7a9fff' }}>⚡</span>
            <div style={{ position: 'relative' }}>
              <select
                value={margenError}
                onChange={e => setMargenError(Number(e.target.value))}
                style={{ appearance: 'none', backgroundColor: isErrorActive ? (isFlipped ? '#0a2a0a' : '#2a0a0a') : NAVY_LIGHT, color: 'white', border: `1px solid ${isErrorActive ? (isFlipped ? SANCHEZ_C : KEIKO_C) : NAVY_BRD}`, borderRadius: 8, padding: '8px 36px 8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minWidth: 230, transition: 'all 0.3s' }}>
                {ERROR_OPTS.map(o => (
                  <option key={o.value} value={o.value} style={{ backgroundColor: NAVY_DARK }}>{o.label}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10 }}>▼</span>
            </div>
          </>
        )}

        {!isGlobal && (
          <button onClick={() => setSelectedId('todos')} style={{ backgroundColor: 'transparent', border: `1px solid ${NAVY_BRD}`, color: '#7a9fff', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
            LIMPIAR
          </button>
        )}
      </div>

      {/* ── LEYENDA DE ZONAS (solo global) ───────────────────────────── */}
      {isGlobal && !isEscenarioHipo && (
        <div style={{ margin: '0 28px 10px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#7a9fff', marginRight: 4 }}>ZONAS DEL CONTEO:</span>
          {(['keiko', 'mixto', 'sanchez'] as Zona[]).map(z => {
            const c = ZONA_CONFIG[z];
            const rango = z === 'keiko' ? '58–74%' : z === 'mixto' ? '75–79%' : '80–100%';
            return (
              <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, backgroundColor: c.bg, border: `1px solid ${c.border}`, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                <span>{c.emoji}</span>
                <strong style={{ color: c.border }}>{rango}</strong>
                <span>{c.desc}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BANNER HIPOTÉTICO (sin error) ────────────────────────────── */}
      {isEscenarioHipo && !isErrorActive && (
        <div style={{ margin: '0 28px 8px', backgroundColor: zonaConf.bg, border: `1px solid ${zonaConf.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{zonaConf.emoji}</span>
          <span>
            Escenario al <strong>{escenario}%</strong> — {zonaConf.desc || zonaConf.texto}.
            {' '}Progreso del conteo restante: <strong>{(interp.factor * 100).toFixed(1)}%</strong> completado.
          </span>
        </div>
      )}

      {/* ── BANNER MARGEN DE ERROR ───────────────────────────────────── */}
      {isErrorActive && (
        <div style={{ margin: '0 28px 10px', backgroundColor: isFlipped ? '#041a04' : '#1a0404', border: `2px solid ${isFlipped ? SANCHEZ_C : KEIKO_C}`, borderRadius: 10, padding: '14px 18px', transition: 'all 0.4s' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 24, marginTop: 2 }}>{isFlipped ? '🔄' : almostFlip ? '⚠️' : '🧪'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: isFlipped ? '#7aff9a' : '#ff9a7a', marginBottom: 6 }}>
                {isFlipped
                  ? `SÁNCHEZ GANARÍA con ±${margenError}% de error`
                  : almostFlip
                  ? `Keiko aún gana, pero muy ajustado (±${margenError}%)`
                  : `Keiko sigue ganando con ±${margenError}% de error`}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                Este margen traslada <strong style={{ color: 'white' }}>{fv(interp.errorVotos)} votos válidos</strong> de Keiko → Sánchez
                {isEscenarioHipo ? ` (en el escenario al ${escenario}%)` : ' (en los datos actuales)'}
              </div>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 12 }}>
                <div>
                  <div style={{ color: '#7a9fff', fontSize: 10, marginBottom: 2 }}>Sin error (proyección base)</div>
                  <div style={{ fontWeight: 700, color: '#ff9a7a' }}>
                    Keiko {interp.keikoBasePct.toFixed(3)}% — Margen: +{fv(Math.abs(interp.keikoBaseVotos - interp.sanchezBaseVotos))} votos (+{interp.margenPP.toFixed(3)} pp)
                  </div>
                </div>
                <div>
                  <div style={{ color: '#7a9fff', fontSize: 10, marginBottom: 2 }}>Con ±{margenError}% de error</div>
                  <div style={{ fontWeight: 700, color: isFlipped ? '#7aff9a' : '#ffb07a' }}>
                    {isFlipped ? 'Sánchez' : 'Keiko'} {(isFlipped ? interp.sanchezPct : interp.keikoPct).toFixed(3)}% — Margen: +{fv(interp.diferencia)} votos (+{Math.abs(interp.keikoPct - interp.sanchezPct).toFixed(3)} pp)
                  </div>
                </div>
                <div>
                  <div style={{ color: '#7a9fff', fontSize: 10, marginBottom: 2 }}>Umbral de volteo</div>
                  <div style={{ fontWeight: 700, color: '#ff9a7a' }}>
                    Se necesita <strong>±{interp.breakevenPct.toFixed(2)}%</strong> para que Sánchez gane
                  </div>
                </div>
              </div>

              {/* Barra de sensibilidad */}
              <div style={{ marginTop: 12 }}>
                <div style={{ position: 'relative', backgroundColor: '#1a1a3a', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min((interp.breakevenPct / 5) * 100, 100)}%`, backgroundColor: 'rgba(217,79,30,0.25)', borderRight: '2px dashed #ff9a7a' }} />
                  <div style={{ position: 'absolute', left: `${Math.min((interp.breakevenPct / 5) * 100, 100)}%`, top: 0, height: '100%', right: 0, backgroundColor: 'rgba(30,122,63,0.2)' }} />
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${Math.min((margenError / 5) * 100, 100)}%`,
                    backgroundColor: isFlipped ? `${SANCHEZ_C}cc` : `${KEIKO_C}cc`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  <span>0%</span>
                  <span style={{ color: '#ff9a7a' }}>Volteo en {interp.breakevenPct.toFixed(2)}%</span>
                  <span>5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLA SENSIBILIDAD COMPLETA (error activo + global) ──────── */}
      {isGlobal && isErrorActive && (
        <div style={{ margin: '0 28px 14px', backgroundColor: NAVY_DARK, border: `1px solid ${NAVY_BRD}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#7a9fff', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
            ¿En qué punto voltea el resultado? — Haz clic para aplicar
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2, 3, 4, 5].map(err => {
              const totBase = interp.keikoBaseVotos + interp.sanchezBaseVotos;
              const errV  = Math.round((err / 100) * totBase);
              const kV    = Math.max(0, interp.keikoBaseVotos - errV);
              const sV    = interp.sanchezBaseVotos + errV;
              const tot   = kV + sV;
              const kP    = kV / tot * 100;
              const sP    = sV / tot * 100;
              const kGana = kV >= sV;
              const diff  = Math.abs(kV - sV);
              const isSel = err === margenError;
              return (
                <div key={err} onClick={() => setMargenError(err)}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: isSel ? (kGana ? '#2a1a0a' : '#0a2a0a') : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSel ? (kGana ? KEIKO_C : SANCHEZ_C) : NAVY_BRD}`,
                  }}>
                  <div style={{ fontSize: 10, color: '#7a9fff', marginBottom: 5 }}>±{err}%</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: kGana ? '#ff9a7a' : '#7aff9a' }}>
                    {kGana ? 'K' : 'S'} {kP.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '3px 0' }}>
                    vs {kGana ? sP.toFixed(2) : kP.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: kGana ? '#ff9a7a' : '#7aff9a' }}>
                    +{fv(diff)}
                  </div>
                  {!kGana && (
                    <div style={{ marginTop: 5, backgroundColor: SANCHEZ_C, borderRadius: 4, padding: '2px 0', fontSize: 9, fontWeight: 800, color: 'white' }}>
                      ⚡ VOLTEO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: '#7a9fff' }}>
            El error representa votos que la proyección asigna a Keiko pero que en realidad van a Sánchez (sesgo rural, actas tardías, etc.).
            Umbral exacto de volteo: <strong style={{ color: '#ff9a7a' }}>{interp.breakevenPct.toFixed(2)}%</strong>.
          </div>
        </div>
      )}

      {/* ── NOTA EXTRANJERO ──────────────────────────────────────────── */}
      {region.nota && (
        <div style={{ margin: '0 28px 10px', backgroundColor: '#0a2a1a', border: '1px solid #1e7a3f', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#7aff9a' }}>
          ✓ {region.nota}
        </div>
      )}

      {/* ── CANDIDATOS ───────────────────────────────────────────────── */}
      <div style={{
        margin: '0 28px 16px', borderRadius: 12, padding: '28px 20px', display: 'flex', alignItems: 'center',
        backgroundColor: isFlipped ? 'rgba(0,60,0,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isFlipped ? SANCHEZ_C : NAVY_BRD}`,
        transition: 'all 0.4s',
      }}>
        {/* GANADOR */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
          <Avatar initials={leftData.initials} color={leftData.color} size={108} />
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1, transition: 'all 0.3s' }}>
              {leftPct.toFixed(3)} %
            </div>
            <div style={{ fontSize: 10, color: '#7a9fff', marginTop: 4 }}>* Votos válidos</div>
            {isGlobal && (
              <div style={{ fontSize: 12, color: '#aac3ff', marginTop: 2 }}>
                ** Votos emitidos: <strong>{(keikoWins ? interp.keikoEmitPct : interp.sanchezEmitPct).toFixed(3)} %</strong>
              </div>
            )}
            {isErrorActive && isGlobal && (
              <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Sin error: {(keikoWins ? interp.keikoBasePct : interp.sanchezBasePct).toFixed(3)} %
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, lineHeight: 1.3 }}>{leftData.nombre}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: leftData.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{leftData.sigla[0]}</div>
              <span style={{ fontSize: 11, color: '#aac3ff' }}>{leftData.partido}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12, color: '#7aff9a' }}>{fv(leftVotos)}</div>
          </div>
        </div>

        {/* CENTRO */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 10px' }}>
          <div style={{ width: 1, height: 50, backgroundColor: NAVY_BRD }} />
          <div style={{ backgroundColor: NAVY_DARK, border: `1px solid ${isFlipped ? SANCHEZ_C : isErrorActive ? KEIKO_C : NAVY_BRD}`, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 130, transition: 'all 0.4s' }}>
            <div style={{ fontSize: 9, color: '#7a9fff', marginBottom: 3, textTransform: 'uppercase' }}>Diferencia</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: leftData.color, transition: 'all 0.3s' }}>+{fv(diferencia)}</div>
            <div style={{ fontSize: 9, color: '#7a9fff', marginTop: 1 }}>votos</div>
            <div style={{ marginTop: 5, fontSize: 9, color: '#7a9fff' }}>Ventaja</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: leftData.color }}>+{Math.abs(leftPct - rightPct).toFixed(3)} pp</div>
            {isErrorActive && (
              <div style={{ marginTop: 8, borderTop: `1px solid ${NAVY_BRD}`, paddingTop: 6, fontSize: 9, color: isFlipped ? '#7aff9a' : '#ff9a7a', fontWeight: 700 }}>
                ±{margenError}% error<br />{isFlipped ? '⚡ VOLTEO' : '→ Keiko gana'}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 50, backgroundColor: NAVY_BRD }} />
        </div>

        {/* PERDEDOR */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
          <Avatar initials={rightData.initials} color={rightData.color} size={88} />
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: 'rgba(255,255,255,0.8)', letterSpacing: -1, transition: 'all 0.3s' }}>
              {rightPct.toFixed(3)} %
            </div>
            <div style={{ fontSize: 10, color: '#7a9fff', marginTop: 4 }}>* Votos válidos</div>
            {isGlobal && (
              <div style={{ fontSize: 12, color: '#aac3ff', marginTop: 2 }}>
                ** Votos emitidos: <strong>{(keikoWins ? interp.sanchezEmitPct : interp.keikoEmitPct).toFixed(3)} %</strong>
              </div>
            )}
            {isErrorActive && isGlobal && (
              <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Sin error: {(keikoWins ? interp.sanchezBasePct : interp.keikoBasePct).toFixed(3)} %
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{rightData.nombre}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: rightData.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{rightData.sigla[0]}</div>
              <span style={{ fontSize: 11, color: '#7a9fff' }}>{rightData.partido}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: 'rgba(255,255,255,0.6)' }}>{fv(rightVotos)}</div>
          </div>
        </div>
      </div>

      {/* ── EVOLUCIÓN DEL MARCADOR (solo global, sin error) ──────────── */}
      {isGlobal && !isErrorActive && (
        <div style={{ margin: '0 28px 16px', backgroundColor: NAVY_DARK, border: `1px solid ${NAVY_BRD}`, borderRadius: 10, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#7a9fff', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
            Evolución del marcador según % de actas contabilizadas
          </div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Actual\n57.8%', factor: 0 },
              { label: '60%',  factor: (60 - REAL.pct) / (100 - REAL.pct) },
              { label: '65%',  factor: (65 - REAL.pct) / (100 - REAL.pct) },
              { label: '70%',  factor: (70 - REAL.pct) / (100 - REAL.pct) },
              { label: '75%',  factor: (75 - REAL.pct) / (100 - REAL.pct) },
              { label: '80%',  factor: (80 - REAL.pct) / (100 - REAL.pct) },
              { label: '85%',  factor: (85 - REAL.pct) / (100 - REAL.pct) },
              { label: '90%',  factor: (90 - REAL.pct) / (100 - REAL.pct) },
              { label: '95%',  factor: (95 - REAL.pct) / (100 - REAL.pct) },
              { label: '100%\nFinal', factor: 1 },
            ].map(({ label, factor }) => {
              const kV   = Math.round(REAL.keikoVotos   + factor * (KEIKO_100   - REAL.keikoVotos));
              const sV   = Math.round(REAL.sanchezVotos  + factor * (SANCHEZ_100 - REAL.sanchezVotos));
              const tot  = kV + sV;
              const kP   = kV / tot * 100;
              const sP   = sV / tot * 100;
              const diff = Math.abs(kV - sV);
              const isSel = escenario !== 'actual' && Math.abs((escenario as number) - (REAL.pct + factor * (100 - REAL.pct))) < 2.5;
              const isAct = factor === 0 && escenario === 'actual';
              const highlighted = isSel || isAct;
              return (
                <div key={label} style={{ flex: '0 0 auto', minWidth: 88, textAlign: 'center', padding: '6px 8px', borderRadius: 8, margin: '0 1px', transition: 'all 0.3s', backgroundColor: highlighted ? '#2a1a0a' : 'transparent', border: highlighted ? `1px solid ${KEIKO_C}` : '1px solid transparent' }}>
                  <div style={{ fontSize: 10, color: '#7a9fff', marginBottom: 6, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ff9a7a' }}>{kP.toFixed(2)}%</div>
                  <div style={{ fontSize: 10, color: '#7a9fff', margin: '2px 0' }}>vs</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{sP.toFixed(2)}%</div>
                  <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: '#ff9a7a' }}>K +{fv(diff)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BLANCOS / NULOS / TOTAL (solo global) ────────────────────── */}
      {isGlobal && (
        <div style={{ margin: '0 28px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {[
            { titulo: 'Votos en Blanco', proy: interp.blancoVotos, real: REAL.blancoVotos, pct: TASA_BLANCO * 100 },
            { titulo: 'Votos Nulos',     proy: interp.nuloVotos,   real: REAL.nuloVotos,   pct: TASA_NULO  * 100 },
          ].map(c => (
            <div key={c.titulo} style={{ backgroundColor: NAVY_DARK, border: `1px solid ${NAVY_BRD}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9fff', textTransform: 'uppercase', marginBottom: 10 }}>{c.titulo}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div><div style={{ fontSize: 10, color: '#7a9fff' }}>Proyectado:</div><div style={{ fontSize: 18, fontWeight: 800 }}>{fv(c.proy)}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: '#7a9fff' }}>** Emitidos:</div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.pct.toFixed(3)} %</div></div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${NAVY_BRD}`, fontSize: 11, color: '#7a9fff' }}>
                Real actual: <strong style={{ color: '#aac3ff' }}>{fv(c.real)}</strong>
              </div>
            </div>
          ))}
          <div style={{ backgroundColor: NAVY_DARK, border: `1px solid ${NAVY_BRD}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7a9fff', textTransform: 'uppercase', marginBottom: 10 }}>Total de Votos</div>
            <div style={{ fontSize: 10, color: '#7a9fff' }}>* Votos válidos:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800, transition: 'all 0.3s' }}>{fv(interp.totalValidos)}</div>
              <div style={{ fontSize: 11, color: '#7a9fff' }}>100 %</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: '#7a9fff' }}>** Votos emitidos:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800, transition: 'all 0.3s' }}>{fv(interp.totalEmitidos)}</div>
              <div style={{ fontSize: 11, color: '#7a9fff' }}>100 %</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLA POR REGIÓN (solo global) ────────────────────────────── */}
      {isGlobal && (
        <div style={{ margin: '0 28px 28px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#aac3ff', marginBottom: 10 }}>
            Detalle por Región — Proyección al 100 % de actas
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${NAVY_BRD}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: NAVY_DARK }}>
                  {['Región', '% Ctdo.', 'Ganador', '% Keiko', '% Sánchez', 'Votos Keiko', 'Votos Sánchez', 'Diferencia'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Región' ? 'left' : 'center', color: '#7a9fff', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${NAVY_BRD}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONES.filter(r => r.id !== 'todos').map((r, i) => {
                  const kg   = r.keikoPct >= r.sanchezPct;
                  const diff = Math.abs(r.keikoVotos - r.sanchezVotos);
                  const bg   = i % 2 === 0 ? '#0d1a50' : NAVY;
                  return (
                    <tr key={r.id} onClick={() => setSelectedId(r.id)} style={{ backgroundColor: bg, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a2d7a')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = bg)}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, borderBottom: '1px solid #1a2d4a' }}>{r.nombre}{r.nota ? ' ✓' : ''}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#7a9fff', borderBottom: '1px solid #1a2d4a' }}>{r.pctContado === 0 ? '—' : `${r.pctContado.toFixed(1)}%`}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #1a2d4a' }}>
                        <span style={{ backgroundColor: kg ? KEIKO_C : SANCHEZ_C, padding: '2px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{kg ? 'KEIKO' : 'SÁNCHEZ'}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: kg ? 700 : 400, color: kg ? '#ff9a7a' : 'rgba(255,255,255,0.5)', borderBottom: '1px solid #1a2d4a' }}>{r.keikoPct.toFixed(3)}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: !kg ? 700 : 400, color: !kg ? '#7aff9a' : 'rgba(255,255,255,0.5)', borderBottom: '1px solid #1a2d4a' }}>{r.sanchezPct.toFixed(3)}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: kg ? '#ff9a7a' : 'rgba(255,255,255,0.5)', borderBottom: '1px solid #1a2d4a', fontVariantNumeric: 'tabular-nums' }}>{fv(r.keikoVotos)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: !kg ? '#7aff9a' : 'rgba(255,255,255,0.5)', borderBottom: '1px solid #1a2d4a', fontVariantNumeric: 'tabular-nums' }}>{fv(r.sanchezVotos)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: kg ? '#ff9a7a' : '#7aff9a', borderBottom: '1px solid #1a2d4a', whiteSpace: 'nowrap' }}>{kg ? 'K' : 'S'} +{fv(diff)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: NAVY_DARK, fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: '10px 12px', color: '#aac3ff', fontSize: 11, textTransform: 'uppercase' }}>TOTAL PROYECTADO (100%)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ff9a7a' }}>{(KEIKO_100 / TOTAL_VALIDOS_100 * 100).toFixed(3)}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7aff9a' }}>{(SANCHEZ_100 / TOTAL_VALIDOS_100 * 100).toFixed(3)}%</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ff9a7a', fontVariantNumeric: 'tabular-nums' }}>{fv(KEIKO_100)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7aff9a', fontVariantNumeric: 'tabular-nums' }}>{fv(SANCHEZ_100)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ff9a7a', whiteSpace: 'nowrap' }}>K +{fv(KEIKO_100 - SANCHEZ_100)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${NAVY_BRD}`, padding: '12px 28px', textAlign: 'center', fontSize: 10, color: '#3a4a7a' }}>
        ★ PROYECCIÓN NO OFICIAL — Datos: ONPE 09:56pm | Blancos/Nulos: ONPE 10:18pm | Extranjero: estimado 65/35 (ref. 2021) — Método: extrapolación lineal por región
      </div>
    </div>
  );
}
