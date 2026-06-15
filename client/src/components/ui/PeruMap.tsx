/** client/src/components/ui/PeruMap.tsx — Mapa coroplético reutilizable del Perú · NEON
 * Antes se veía PLANO: stroke="white" en cada departamento, marcadores BLANCOS con
 * texto negro, fondo claro por defecto, tooltip gris. Ahora: bordes cian translúcidos,
 * marcadores oscuros con borde de color + glow (halo) dimensionados por volumen,
 * seleccionado con drop-shadow de acento, tooltip neon. MISMA API (props) → no rompe
 * a quien lo usa (DashboardMapRegion).
 */

import { useState, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL =
  "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson";

export function normalizeRegion(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const CENTROIDS_PERU: Record<string, [number, number]> = {
  "amazonas":      [-77.9,  -5.8 ],
  "ancash":        [-77.5,  -9.4 ],
  "apurimac":      [-72.9, -13.7 ],
  "arequipa":      [-72.0, -15.9 ],
  "ayacucho":      [-74.2, -13.2 ],
  "cajamarca":     [-78.5,  -6.8 ],
  "callao":        [-77.1, -12.05],
  "cusco":         [-71.5, -13.2 ],
  "huancavelica":  [-75.0, -12.8 ],
  "huanuco":       [-76.5,  -9.9 ],
  "ica":           [-75.5, -14.1 ],
  "junin":         [-75.0, -11.5 ],
  "la libertad":   [-78.5,  -8.0 ],
  "lambayeque":    [-79.9,  -6.5 ],
  "lima":          [-76.5, -11.6 ],
  "loreto":        [-74.5,  -4.5 ],
  "madre de dios": [-70.4, -11.8 ],
  "moquegua":      [-70.8, -16.7 ],
  "pasco":         [-76.2, -10.5 ],
  "piura":         [-80.0,  -5.3 ],
  "puno":          [-70.2, -15.0 ],
  "san martin":    [-76.5,  -6.8 ],
  "tacna":         [-70.2, -17.5 ],
  "tumbes":        [-80.4,  -3.7 ],
  "ucayali":       [-74.8,  -9.5 ],
};

export interface MapMarker {
  zona:      string; // normalizado (con espacios)
  value:     number; // número mostrado en el círculo
  highlight?: boolean;
}

interface PeruMapProps {
  /** Devuelve el color de fill dado el nombre normalizado del departamento */
  getColor:    (normName: string) => string;
  /** Marcadores con círculo numerado */
  markers:     MapMarker[];
  /** Región seleccionada (nombre normalizado) */
  selected?:   string;
  /** Color de relleno para la región seleccionada */
  selectColor?: string;
  /** Callback al hacer clic en un departamento o marcador con datos */
  onSelect?:   (normName: string) => void;
  /** Alto del mapa — por defecto clamp responsive */
  height?:     string | number;
  /** Color de fondo del contenedor */
  bgColor?:    string;
}

export function PeruMap({
  getColor,
  markers,
  selected,
  selectColor = "#06b6d4",
  onSelect,
  height = "clamp(280px, 45vw, 500px)",
  bgColor = "#0a1120",
}: PeruMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const markerMap = new Map(markers.map(m => [m.zona, m]));
  const maxValue  = Math.max(...markers.map(m => m.value), 1);

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full rounded-xl overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% 30%, rgba(6,182,212,0.06), transparent 70%), ${bgColor}`,
      }}
      onMouseMove={e => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
      }}
    >
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap capitalize"
          style={{
            left: tooltip.x + 12, top: tooltip.y - 32,
            background: "rgba(10,16,31,0.95)",
            border: `1px solid ${selectColor}59`,
            color: "#e4e4e7",
          }}
        >
          {tooltip.name}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1850, center: [-75, -9.5] }}
        style={{ width: "100%", height }}
      >
        {/* Filtros de glow */}
        <defs>
          <filter id="peru-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="peru-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={selectColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={selectColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map(geo => {
              const name       = (geo.properties?.NOMBDEP ?? "") as string;
              const norm       = normalizeRegion(name);
              const isSelected = selected === norm;
              const hasData    = markerMap.has(norm);

              return (
                <Geography
                  key={geo.rsmKey ?? name}
                  geography={geo}
                  fill={isSelected ? selectColor : getColor(norm)}
                  stroke={isSelected ? selectColor : "rgba(120,200,230,0.18)"}
                  strokeWidth={isSelected ? 1.6 : 0.6}
                  style={{
                    default: {
                      outline: "none",
                      cursor: hasData ? "pointer" : "default",
                      transition: "filter 0.2s ease, fill 0.2s ease, opacity 0.2s ease",
                      filter: isSelected ? `drop-shadow(0 0 8px ${selectColor})` : "none",
                    },
                    hover: {
                      outline: "none",
                      opacity: hasData && !isSelected ? 0.9 : 1,
                      cursor: hasData ? "pointer" : "default",
                      filter: hasData && !isSelected ? "brightness(1.3)" : (isSelected ? `drop-shadow(0 0 8px ${selectColor})` : "none"),
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={e => {
                    if (!mapRef.current) return;
                    const rect = mapRef.current.getBoundingClientRect();
                    setTooltip({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => hasData && onSelect?.(norm)}
                />
              );
            })
          }
        </Geographies>

        {/* Marcadores numerados (oscuros con borde + glow, tamaño por volumen) */}
        {markers.map(m => {
          const coords = CENTROIDS_PERU[m.zona];
          if (!coords) return null;
          const isSelected = selected === m.zona;
          const baseColor  = getColor(m.zona);
          const r          = 7 + (m.value / maxValue) * 11;
          return (
            <Marker
              key={m.zona}
              coordinates={coords}
              onClick={() => onSelect?.(m.zona)}
            >
              {/* Halo */}
              <circle r={r + 6} fill="url(#peru-halo)" opacity={isSelected ? 1 : 0.6} style={{ pointerEvents: "none" }} />
              {/* Punto */}
              <circle
                r={isSelected ? r + 2 : r}
                fill={isSelected ? selectColor : "#0a1322"}
                stroke={isSelected ? "#ffffff" : baseColor}
                strokeWidth={isSelected ? 2 : 1.5}
                style={{ cursor: "pointer", filter: `drop-shadow(0 0 ${isSelected ? 8 : 5}px ${isSelected ? selectColor : baseColor})` }}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={r > 12 ? 10 : 8}
                fontWeight={700}
                fill={isSelected ? "#04101a" : "#e4f7ff"}
                style={{ pointerEvents: "none" }}
              >
                {m.value > 999 ? "999+" : m.value}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}