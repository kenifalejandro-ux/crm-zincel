/** client/src/components/inteligencia/IntentosCobertura.tsx */

import { useEffect, useState } from "react";
import { CARD_CLASS, HEADER_CLASS, COLORS } from "../../lib/tokens";
import { Phone, Users, RefreshCw, Lightbulb } from "lucide-react";
import api from "../../services/api";

interface Datos {
  total_llamadas:   number;
  empresas_unicas:  number;
  promedio_intentos: number;
  empresas_1:       number;
  empresas_2:       number;
  empresas_3mas:    number;
  llamadas_en_3mas: number;
}

function generarLectura(d: Datos): { titulo: string; parrafos: string[]; alerta: string | null } {
  const pct1    = Math.round((d.empresas_1    / d.empresas_unicas) * 100);
  const pct2    = Math.round((d.empresas_2    / d.empresas_unicas) * 100);
  const pct3    = Math.round((d.empresas_3mas / d.empresas_unicas) * 100);
  const pctEsf  = d.total_llamadas > 0 ? Math.round((d.llamadas_en_3mas / d.total_llamadas) * 100) : 0;
  const prom    = Number(d.promedio_intentos);

  let titulo: string;
  if (prom < 1.3)       titulo = "Alta eficiencia de contacto";
  else if (prom < 2.0)  titulo = "Eficiencia de contacto moderada";
  else                  titulo = "Alto retrabajo comercial";

  const parrafos: string[] = [];

  parrafos.push(
    `De ${d.empresas_unicas} empresas prospectadas, el ${pct1}% se contactó al primer intento` +
    (pct1 >= 70
      ? " — señal de una base de datos con buena calidad de contacto."
      : pct1 >= 50
      ? " — hay margen para mejorar la calidad de los datos de contacto."
      : " — la mayoría de leads requiere más de un intento, lo que sugiere datos de contacto con problemas.")
  );

  if (d.empresas_2 > 0) {
    parrafos.push(
      `${d.empresas_2} empresas (${pct2}%) requirieron exactamente 2 llamadas para ser contactadas. ` +
      "Esto es normal en prospección y no representa un problema operativo."
    );
  }

  if (d.empresas_3mas > 0) {
    parrafos.push(
      `${d.empresas_3mas} empresas (${pct3}%) concentran 3 o más intentos — ${d.llamadas_en_3mas} llamadas en total, ` +
      `equivalente al ${pctEsf}% de todo el esfuerzo de llamadas.`
    );
  }

  let alerta: string | null = null;
  if (d.empresas_3mas > 0 && pctEsf >= 15) {
    alerta = `${d.empresas_3mas} empresas con 3+ intentos están absorbiendo el ${pctEsf}% de tus llamadas sin dar resultado. Revísalas y descarta las que lleven más de 3 semanas sin respuesta para liberar ese esfuerzo comercial.`;
  } else if (prom >= 2.0) {
    alerta = "El promedio de intentos por empresa es alto. Considera limpiar la base de datos: elimina o descarta leads con datos de contacto inválidos.";
  }

  return { titulo, parrafos, alerta };
}

export function IntentosCobertura() {
  const [datos,    setDatos]    = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get("/llamadas/analisis-intentos")
      .then(r => setDatos(r.data.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
    </div>
  );
  if (!datos) return null;

  const { titulo, parrafos, alerta } = generarLectura(datos);
  const pct1   = Math.round((datos.empresas_1    / datos.empresas_unicas) * 100);
  const pct2   = Math.round((datos.empresas_2    / datos.empresas_unicas) * 100);
  const pct3   = Math.round((datos.empresas_3mas / datos.empresas_unicas) * 100);
  const prom   = Number(datos.promedio_intentos);

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${CARD_CLASS} text-center`}>
          <Phone size={16} className="mx-auto mb-2 text-zinc-400" />
          <p className="text-2xl font-bold text-zinc-100">{datos.total_llamadas}</p>
          <p className="text-[10px] text-zinc-100 uppercase tracking-widest mt-1">Llamadas totales</p>
        </div>
        <div className={`${CARD_CLASS} text-center`}>
          <Users size={16} className="mx-auto mb-2 text-zinc-400" />
          <p className="text-2xl font-bold text-zinc-100">{datos.empresas_unicas}</p>
          <p className="text-[10px] text-zinc-100 uppercase tracking-widest mt-1">Empresas únicas</p>
        </div>
        <div className={`${CARD_CLASS} text-center`}>
          <RefreshCw size={16} className="mx-auto mb-2 text-zinc-400" />
          <p className="text-2xl font-bold" style={{ color: prom < 1.5 ? COLORS.success : prom < 2.5 ? COLORS.primary : COLORS.danger }}>
            {prom.toFixed(1)}x
          </p>
          <p className="text-[10px] text-zinc-100 uppercase tracking-widest mt-1">Intentos / empresa</p>
        </div>
      </div>

      {/* Distribución */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <span className="mr-2 text-violet-500">◼</span>
          Distribución de intentos por empresa
        </h2>

        <div className="space-y-3 mt-3">
          {[
            { label: "1 llamada",    count: datos.empresas_1,    pct: pct1, color: COLORS.success },
            { label: "2 llamadas",   count: datos.empresas_2,    pct: pct2, color: COLORS.primary },
            { label: "3 o más",      count: datos.empresas_3mas, pct: pct3, color: COLORS.danger  },
          ].map(row => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">{row.label}</span>
                <span className="font-bold text-zinc-200">{row.count} empresas <span className="text-zinc-400 font-normal">· {row.pct}%</span></span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-400 mt-3">
          {datos.total_llamadas} llamadas totales → {datos.empresas_unicas} empresas únicas · promedio {prom.toFixed(2)} intentos/empresa
        </p>
      </div>

      {/* Lectura de análisis */}
      <div className={CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <Lightbulb size={14} className="mr-2 text-amber-500" strokeWidth={2} />
          Lectura del análisis
        </h2>

        <div className="mt-3 space-y-3">
          <p className="text-sm font-semibold text-zinc-200">{titulo}</p>
          {parrafos.map((p, i) => (
            <p key={i} className="text-xs text-zinc-400 leading-relaxed">{p}</p>
          ))}
        </div>

        {alerta && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <span className="font-bold">Recomendación: </span>{alerta}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
