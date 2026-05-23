/** src/components/metricas/detalle/ResumenDetalle.tsx */

import { MetricasCalculadas } from "../../../utils/metricas.calc";
import { Metrica }            from "../../../types/metricas.types";

interface Props {
  metrica:    Metrica;
  calculado:  MetricasCalculadas;
}

const COLOR_BADGE: Record<string, string> = {
  green:  "bg-green-100  text-green-700",
  blue:   "bg-blue-100   text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red:    "bg-red-100    text-red-700",
};

const COLOR_SCORE: Record<string, string> = {
  green:  "text-green-600",
  blue:   "text-blue-600",
  yellow: "text-yellow-600",
  red:    "text-red-600",
};

const COLOR_SEMAFORO: Record<string, string> = {
  green:  "border-l-green-500",
  yellow: "border-l-yellow-500",
  red:    "border-l-red-500",
};

const COLOR_DOT: Record<string, string> = {
  green:  "bg-green-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
};

interface KpiBoxProps {
  label:  string;
  valor:  string;
  sub?:   string;
}

const KpiBox = ({ label, valor, sub }: KpiBoxProps) => (
  <div className="bg-zinc-50 rounded-xl p-3 space-y-0.5">
    <p className="text-[10px] text-zinc-600 uppercase tracking-wide">{label}</p>
    <p className="text-lg font-bold text-zinc-800">{valor}</p>
    {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
  </div>
);

export const ResumenDetalle = ({ metrica: m, calculado: c }: Props) => (
  <div className="space-y-5">

    {/* Health Score */}
    <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4">
      <div className="text-center">
        <p className={`text-5xl font-black ${COLOR_SCORE[c.health_color]}`}>
          {c.health_score}
        </p>
        <p className="text-[10px] text-zinc-600 mt-0.5">/ 100</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLOR_BADGE[c.health_color]}`}>
            Campaña {c.health_label}
          </span>
        </div>
        <p className="text-xs text-zinc-700">
          {c.health_color === "green"  && "Esta campaña está rindiendo muy bien. Considera escalar el presupuesto."}
          {c.health_color === "blue"   && "La campaña tiene buen rendimiento con oportunidades de mejora."}
          {c.health_color === "yellow" && "La campaña necesita optimización. Revisa las métricas en rojo."}
          {c.health_color === "red"    && "La campaña está en estado crítico. Pausa y restructura antes de seguir invirtiendo."}
        </p>
      </div>
    </div>

    {/* KPIs calculados */}
    <div>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">
        Métricas calculadas
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <KpiBox label="CTR"               valor={`${c.ctr}%`}        sub="Tasa de clic"         />
        <KpiBox label="CPC"               valor={`S/ ${c.cpc}`}      sub="Costo por clic"       />
        <KpiBox label="CPM"               valor={`S/ ${c.cpm}`}      sub="Por 1,000 impres."    />
        <KpiBox label="CPA"               valor={`S/ ${c.cpa}`}      sub="Costo por conversión" />
        <KpiBox label="ROAS"              valor={`${c.roas}x`}       sub="Retorno publicitario" />
        <KpiBox label="ROI"               valor={`${c.roi}%`}        sub="Retorno total"        />
        <KpiBox label="Frecuencia"        valor={`${c.frecuencia}x`} sub="Veces visto"          />
        <KpiBox label="Costo/Lead"        valor={`S/ ${c.costo_por_lead}`}    sub="Por lead"    />
        <KpiBox label="Costo/Mensaje"     valor={`S/ ${c.costo_por_mensaje}`} sub="Por mensaje" />
        <KpiBox label="Tasa conversión"   valor={`${c.tasa_conversion}%`}     sub="Clics → Conv." />
        <KpiBox label="Tasa cierre"       valor={`${c.tasa_cierre}%`}         sub="Leads → Venta" />
        <KpiBox label="Ticket promedio"   valor={`S/ ${c.ticket_promedio}`}   sub="Por venta"   />
        <KpiBox label="Margen neto"       valor={`S/ ${c.margen_neto}`}       sub="Ingresos - Costos" />
        <KpiBox label="Punto equilibrio"  valor={`${c.punto_equilibrio} ventas`} sub="Para cubrir costos" />
      </div>
    </div>

    {/* Datos de alcance y engagement */}
    {(m.impresiones > 0 || m.alcance > 0 || m.clics > 0 || m.seguidores_ganados > 0 ||
      m.me_gusta > 0 || m.comentarios > 0 || m.compartidos > 0 || m.guardados > 0 ||
      m.perfil_visitas > 0 || m.reproducciones > 0) && (
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">
          Datos de alcance y engagement
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {m.impresiones    > 0 && <KpiBox label="Impresiones"       valor={m.impresiones.toLocaleString("es-PE")}    sub="Veces mostrado"      />}
          {m.alcance        > 0 && <KpiBox label="Alcance"           valor={m.alcance.toLocaleString("es-PE")}        sub="Personas únicas"     />}
          {m.clics          > 0 && <KpiBox label="Clics"             valor={m.clics.toLocaleString("es-PE")}          sub="Total de clics"      />}
          {m.leads          > 0 && <KpiBox label="Leads"             valor={m.leads.toLocaleString("es-PE")}          sub="Formularios"         />}
          {m.mensajes       > 0 && <KpiBox label="Mensajes"          valor={m.mensajes.toLocaleString("es-PE")}       sub="Conversaciones"      />}
          {m.conversiones   > 0 && <KpiBox label="Conversiones"      valor={m.conversiones.toLocaleString("es-PE")}   sub="Ventas / acciones"   />}
          {m.seguidores_ganados > 0 && <KpiBox label="Seguidores"    valor={`+${m.seguidores_ganados.toLocaleString("es-PE")}`} sub="Ganados en el período" />}
          {m.perfil_visitas > 0 && <KpiBox label="Visitas perfil"    valor={m.perfil_visitas.toLocaleString("es-PE")} sub="Visitas al perfil"   />}
          {m.interacciones  > 0 && <KpiBox label="Interacciones"      valor={m.interacciones.toLocaleString("es-PE")}  sub="Total de contenido"  />}
          {m.me_gusta       > 0 && <KpiBox label="Me gusta"          valor={m.me_gusta.toLocaleString("es-PE")}       sub="Reacciones"          />}
          {m.comentarios    > 0 && <KpiBox label="Comentarios"       valor={m.comentarios.toLocaleString("es-PE")}    sub="En publicaciones"    />}
          {m.compartidos    > 0 && <KpiBox label="Compartidos"       valor={m.compartidos.toLocaleString("es-PE")}    sub="Veces compartido"    />}
          {m.guardados      > 0 && <KpiBox label="Guardados"         valor={m.guardados.toLocaleString("es-PE")}      sub="Publicaciones guardadas" />}
          {m.reproducciones > 0 && <KpiBox label="Reproducciones"    valor={m.reproducciones.toLocaleString("es-PE")} sub="Views de video"      />}
        </div>
      </div>
    )}

    {/* Semáforos */}
    <div>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wide mb-2">
        Evaluación vs benchmark de mercado
      </p>
      <div className="space-y-2">
        {Object.entries(c.semaforos).map(([key, s]) => (
          <div
            key={key}
            className={`border-l-4 ${COLOR_SEMAFORO[s.estado]} bg-zinc-50 rounded-r-xl px-4 py-2.5 flex items-start justify-between gap-4`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${COLOR_DOT[s.estado]}`} />
                <span className="text-xs font-semibold text-zinc-700 uppercase">{key}</span>
                <span className="text-xs text-zinc-600">Benchmark: {s.benchmark}</span>
              </div>
              <p className="text-xs text-zinc-700">{s.lectura}</p>
            </div>
            <span className="text-sm font-bold text-zinc-800 shrink-0">
              {key === "roas" ? `${s.valor}x` :
               key === "frecuencia" ? `${s.valor}x` :
               key === "ctr" ? `${s.valor}%` :
               `S/ ${s.valor}`}
            </span>
          </div>
        ))}
      </div>
    </div>

  </div>
);