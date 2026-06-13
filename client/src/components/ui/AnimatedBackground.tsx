/**
 * AnimatedBackground — nebulosa suave que viaja de esquina en esquina.
 *
 * Solo CSS (radial-gradient animado vía @keyframes sun-travel en index.css),
 * sin canvas ni JS → consumo de CPU mínimo.
 *
 * Para cambiar colores/velocidad → edita @keyframes sun-travel en index.css.
 */

export function AnimatedBackground() {
  return (
    <div className="crm-sun-bg pointer-events-none fixed inset-0 z-0" />
  );
}
