/**
 * AnimatedBackground — luz solar que viaja de esquina en esquina.
 *
 * Para cambiar los colores o la velocidad:
 *   → edita @keyframes sun-travel en index.css
 *
 * Para cambiar la intensidad (qué tan visible es el color):
 *   → ajusta el último valor rgba (0.45 = más visible, 0.15 = más sutil)
 *
 * Para cambiar la velocidad:
 *   → cambia el "18s" en .crm-sun-bg dentro de index.css
 */

export function AnimatedBackground() {
  return (
    <div className="crm-sun-bg pointer-events-none fixed inset-0 z-0" />
  );
}
