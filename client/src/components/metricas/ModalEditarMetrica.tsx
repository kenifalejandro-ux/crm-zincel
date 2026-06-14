/** client/src/components/metricas/ModalEditarMetrica.tsx */

import { INPUT_BASE } from "../../lib/tokens";
import { useState, useEffect } from "react";
import { ModalEditar }         from "../ui/ModalEditar";
import { Input }               from "../ui/Input";
import { Metrica, Plataforma } from "../../types/metricas.types";
import { calcularDesdeForm }   from "../../utils/metricas.calc";

// ─── Tipos internos ────────────────────────────────────────────────────────────

export type FormEditarMetrica = {
  empresa:            string;
  campana_nombre:     string;
  plataforma:         Plataforma;
  sub_plataforma:     string;
  periodo_inicio:     string;
  periodo_fin:        string;
  impresiones:        string;
  alcance:            string;
  clics:              string;
  ctr:                string;
  gasto:              string;
  cpc:                string;
  cpm:                string;
  cpa:                string;
  ingresos:           string;
  costo_total:        string;
  conversiones:       string;
  leads:              string;
  mensajes:           string;
  roas:               string;
  roi:                string;
  costo_por_lead:     string;
  seguidores_ganados: string;
  perfil_visitas:     string;
  frecuencia:         string;
  me_gusta:           string;
  comentarios:        string;
  compartidos:        string;
  guardados:          string;
  tasa_engagement:    string;
  costo_por_mensaje:  string;
  reproducciones:     string;
  tasa_reproduccion:  string;
  notas:              string;
};

export function metricaToForm(m: Metrica): FormEditarMetrica {
  return {
    empresa:            m.empresa,
    campana_nombre:     m.campana_nombre,
    plataforma:         m.plataforma,
    sub_plataforma:     m.sub_plataforma ?? "",
    periodo_inicio:     m.periodo_inicio,
    periodo_fin:        m.periodo_fin,
    impresiones:        String(m.impresiones),
    alcance:            String(m.alcance),
    clics:              String(m.clics),
    ctr:                String(m.ctr),
    gasto:              String(m.gasto),
    cpc:                String(m.cpc),
    cpm:                String(m.cpm),
    cpa:                String(m.cpa),
    ingresos:           String(m.ingresos),
    costo_total:        String(m.costo_total),
    conversiones:       String(m.conversiones),
    leads:              String(m.leads),
    mensajes:           String(m.mensajes),
    roas:               String(m.roas),
    roi:                String(m.roi),
    costo_por_lead:     String((m as any).costo_por_lead ?? 0),
    seguidores_ganados: String(m.seguidores_ganados),
    perfil_visitas:     String(m.perfil_visitas),
    frecuencia:         String(m.frecuencia),
    me_gusta:           String(m.me_gusta),
    comentarios:        String(m.comentarios),
    compartidos:        String(m.compartidos),
    guardados:          String(m.guardados),
    tasa_engagement:    String(m.tasa_engagement),
    costo_por_mensaje:  String(m.costo_por_mensaje),
    reproducciones:     String(m.reproducciones),
    tasa_reproduccion:  String(m.tasa_reproduccion),
    notas:              m.notas ?? "",
  };
}

// ─── Sub-componentes de UI ─────────────────────────────────────────────────────

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{titulo}</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{children}</div>
  </div>
);

const Campo = ({
  label, value, onChange, calculado = false,
}: {
  label:      string;
  value:      string;
  onChange:   (v: string) => void;
  calculado?: boolean;
}) => (
  <div>
    <label className="text-xs text-zinc-300 mb-1 block">
      {label}
      {calculado && <span className="ml-1 text-[10px] text-accent font-normal">· auto</span>}
    </label>
    <input
      type="number" min="0" value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={calculado}
      className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none transition ${ calculado ? "border-white/[0.06] text-zinc-500 cursor-not-allowed bg-white/[0.02]" : "border-white/10 focus:ring-2 focus:ring-accent/40" }`}
      placeholder="0"
    />
  </div>
);

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  metrica:   Metrica;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: FormEditarMetrica) => void;
  onCerrar:  () => void;
}

// ─── Componente ────────────────────────────────────────────────────────────────

export function ModalEditarMetrica({ metrica, guardando, error, onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<FormEditarMetrica>(() => metricaToForm(metrica));

  const set = (key: keyof FormEditarMetrica, v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  // Recalcula campos derivados cuando cambian los inputs base
  useEffect(() => {
    const c = calcularDesdeForm(form as any);
    setForm((f) => ({
      ...f,
      ctr:               c.ctr,
      cpc:               c.cpc,
      cpm:               c.cpm,
      cpa:               c.cpa,
      roas:              c.roas,
      roi:               c.roi,
      frecuencia:        c.frecuencia,
      costo_por_mensaje: c.costo_por_mensaje,
      costo_por_lead:    c.costo_por_lead,
    }));
  }, [
    form.impresiones, form.clics,    form.gasto,
    form.conversiones, form.ingresos, form.costo_total,
    form.alcance,      form.mensajes, form.leads,
  ]);

  return (
    <ModalEditar
      nombre={`${metrica.empresa} — ${metrica.campana_nombre}`}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar(form)}
      onCerrar={onCerrar}
      size="xl"
    >
      <div className="space-y-5">

        {/* Metadatos */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Empresa *"
            value={form.empresa}
            onChange={(e) => set("empresa", e.target.value)}
          />
          <Input
            label="Nombre campaña *"
            value={form.campana_nombre}
            onChange={(e) => set("campana_nombre", e.target.value)}
          />
          <Input
            label="Período inicio"
            type="date"
            value={form.periodo_inicio}
            onChange={(e) => set("periodo_inicio", e.target.value)}
          />
          <Input
            label="Período fin"
            type="date"
            value={form.periodo_fin}
            onChange={(e) => set("periodo_fin", e.target.value)}
          />
        </div>

        {/* Plataforma */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-300 mb-1 block">Plataforma *</label>
            <select
              value={form.plataforma}
              onChange={(e) =>
                setForm((f) => ({ ...f, plataforma: e.target.value as Plataforma, sub_plataforma: "" }))
              }
              className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
            >
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
          </div>
          {form.plataforma === "meta" && (
            <div>
              <label className="text-xs text-zinc-300 mb-1 block">Red social</label>
              <select
                value={form.sub_plataforma}
                onChange={(e) => set("sub_plataforma", e.target.value)}
                className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40`}
              >
                <option value="">Ambas</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="audience_network">Audience Network</option>
              </select>
            </div>
          )}
        </div>

        <Seccion titulo="📊 Alcance">
          <Campo label="Impresiones"  value={form.impresiones} onChange={(v) => set("impresiones", v)} />
          <Campo label="Alcance"      value={form.alcance}     onChange={(v) => set("alcance", v)} />
          <Campo label="Clics"        value={form.clics}       onChange={(v) => set("clics", v)} />
          <Campo label="CTR (%)"      value={form.ctr}         onChange={() => {}} calculado />
        </Seccion>

        <Seccion titulo="💰 Costo">
          <Campo label="Gasto (S/)"  value={form.gasto} onChange={(v) => set("gasto", v)} />
          <Campo label="CPC"         value={form.cpc}   onChange={() => {}} calculado />
          <Campo label="CPM"         value={form.cpm}   onChange={() => {}} calculado />
          <Campo label="CPA"         value={form.cpa}   onChange={() => {}} calculado />
        </Seccion>

        <Seccion titulo="📈 Ingresos y costos totales">
          <Campo label="Ingresos (S/)"    value={form.ingresos}    onChange={(v) => set("ingresos", v)} />
          <Campo label="Costo total (S/)" value={form.costo_total} onChange={(v) => set("costo_total", v)} />
        </Seccion>

        <Seccion titulo="🎯 Resultados">
          <Campo label="Conversiones"   value={form.conversiones}  onChange={(v) => set("conversiones", v)} />
          <Campo label="Leads"          value={form.leads}         onChange={(v) => set("leads", v)} />
          <Campo label="Mensajes"       value={form.mensajes}      onChange={(v) => set("mensajes", v)} />
          <Campo label="ROAS"           value={form.roas}          onChange={() => {}} calculado />
          <Campo label="ROI (%)"        value={form.roi}           onChange={() => {}} calculado />
          <Campo label="Costo por lead" value={form.costo_por_lead} onChange={() => {}} calculado />
        </Seccion>

        <Seccion titulo="👥 Comunidad">
          <Campo label="Seguidores ganados" value={form.seguidores_ganados} onChange={(v) => set("seguidores_ganados", v)} />
          <Campo label="Visitas al perfil"  value={form.perfil_visitas}     onChange={(v) => set("perfil_visitas", v)} />
          <Campo label="Frecuencia"         value={form.frecuencia}         onChange={() => {}} calculado />
        </Seccion>

        <Seccion titulo="❤️ Engagement">
          <Campo label="Me gusta"             value={form.me_gusta}         onChange={(v) => set("me_gusta", v)} />
          <Campo label="Comentarios"          value={form.comentarios}      onChange={(v) => set("comentarios", v)} />
          <Campo label="Compartidos"          value={form.compartidos}      onChange={(v) => set("compartidos", v)} />
          <Campo label="Guardados"            value={form.guardados}        onChange={(v) => set("guardados", v)} />
          <Campo label="Tasa engagement (%)"  value={form.tasa_engagement}  onChange={(v) => set("tasa_engagement", v)} />
          <Campo label="Costo por mensaje"    value={form.costo_por_mensaje} onChange={() => {}} calculado />
        </Seccion>

        <Seccion titulo="🎥 Video">
          <Campo label="Reproducciones"        value={form.reproducciones}    onChange={(v) => set("reproducciones", v)} />
          <Campo label="Tasa reproducción (%)" value={form.tasa_reproduccion} onChange={(v) => set("tasa_reproduccion", v)} />
        </Seccion>

        <div>
          <label className="text-xs text-zinc-300 mb-1 block">Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            rows={2}
            className={`${INPUT_BASE} w-full px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none`}
            placeholder="Observaciones opcionales..."
          />
        </div>

      </div>
    </ModalEditar>
  );
}
