/** client/src/components/ui/structure.tsx
 *
 *  Primitivas de ESTRUCTURA — los bloques que dan jerarquía premium a cualquier
 *  página. Reemplazan los "grids sueltos apilados" por páginas organizadas en
 *  secciones con título, banda de KPIs y ritmo visual.
 *
 *  Ejemplo de uso en una página:
 *
 *    <PageContainer>
 *      <PageHeader kicker="Análisis" titulo="Dashboard" acciones={<Filtros/>} />
 *
 *      <KpiBand>
 *        <StatTile label="Llamadas" value={120} accent />
 *        <StatTile label="Reuniones" value={8} />
 *        <StatTile label="Conversión" value="24%" accent />
 *        <StatTile label="Ventas" value="S/ 48k" />
 *      </KpiBand>
 *
 *      <Section kicker="Actividad" titulo="Hoy y temperatura de leads">
 *        <Grid cols={2}> … </Grid>
 *      </Section>
 *    </PageContainer>
 */
import type { ReactNode } from "react";

/* ── Contenedor de página ──────────────────────────────────────────────────── */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1320px] space-y-7">{children}</div>;
}

/* ── Cabecera de página ────────────────────────────────────────────────────── */
export function PageHeader({
  kicker, titulo, descripcion, acciones,
}: {
  kicker?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between fade-up">
      <div className="min-w-0">
        {kicker && (
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{kicker}</p>
        )}
        <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-zinc-50 leading-tight mt-1.5 tracking-tight">
          {titulo}
        </h1>
        {descripcion && <p className="text-[13px] text-zinc-500 mt-1.5">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2 shrink-0">{acciones}</div>}
    </div>
  );
}

/* ── Sección con kicker + título ───────────────────────────────────────────── */
export function Section({
  kicker, titulo, derecha, children, className = "",
}: {
  kicker?: string;
  titulo?: string;
  derecha?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3.5 ${className}`}>
      {(titulo || kicker || derecha) && (
        <div className="flex items-end justify-between gap-3">
          <div>
            {kicker && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{kicker}</p>
            )}
            {titulo && <h2 className="font-display text-[17px] font-bold text-zinc-100 mt-0.5">{titulo}</h2>}
          </div>
          {derecha && <div className="shrink-0">{derecha}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Grid responsivo (1/2/3/4 columnas) ────────────────────────────────────── */
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 lg:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};
export function Grid({ cols = 3, children, className = "" }: { cols?: 1 | 2 | 3 | 4; children: ReactNode; className?: string }) {
  return <div className={`grid ${COLS[cols]} gap-5 ${className}`}>{children}</div>;
}

/* ── Banda de KPIs (la "tira" de números con glow del hero) ────────────────── */
export function KpiBand({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.06] fade-up">
      {children}
    </div>
  );
}

/* ── Tile de estadística (número grande con glow) ──────────────────────────── */
export function StatTile({
  label, value, accent = false, danger = false, icon, small = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  small?: boolean;
}) {
  const color = danger ? "text-red-400" : accent ? "text-accent" : "text-zinc-100";
  const shadow = accent
    ? { textShadow: "0 0 18px rgb(var(--accent) / calc(0.5*var(--glow)))" }
    : danger
    ? { textShadow: "0 0 18px rgba(248,113,113,0.45)" }
    : undefined;
  return (
    <div className="bg-[#0a101f]/90 px-5 py-4">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-zinc-500">{icon}</span>}
        <p className={`font-display font-bold leading-none tabular-nums ${small ? "text-[19px]" : "text-[26px]"} ${color}`} style={shadow}>
          {value}
        </p>
      </div>
      <p className="text-[9.5px] text-zinc-500 mt-2 uppercase tracking-[0.16em]">{label}</p>
    </div>
  );
}

/* ── Chip de filtro (segmento activo/inactivo coherente) ───────────────────── */
export function FilterChip({
  activo, children, onClick, icon,
}: {
  activo?: boolean;
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all " +
        (activo
          ? "bg-accent-15 text-accent border border-accent-30"
          : "bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]")
      }
      style={activo ? { boxShadow: "0 0 14px rgb(var(--accent) / calc(0.2*var(--glow)))" } : undefined}
    >
      {icon}
      {children}
    </button>
  );
}
