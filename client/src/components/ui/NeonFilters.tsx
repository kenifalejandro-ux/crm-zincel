/**
 * NeonFilters — define filtros SVG de glow una sola vez para TODO el CRM.
 *
 * Se renderiza oculto en el layout. Los charts de Recharts lo referencian
 * vía CSS (filter: url(#neon-glow)) en index.css — el glow conserva el
 * color propio de cada línea/barra (blur del SourceGraphic).
 */

export function NeonFilters() {
  return (
    <svg
      width="0"
      height="0"
      className="pointer-events-none absolute"
      aria-hidden="true"
    >
      <defs>
        {/* Glow que conserva el color de la serie */}
        <filter id="neon-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b1" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow más intenso para líneas finas */}
        <filter id="neon-glow-strong" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b2" />
          <feMerge>
            <feMergeNode in="b2" />
            <feMergeNode in="b2" />
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
