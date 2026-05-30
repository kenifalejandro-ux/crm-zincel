/** client/src/components/ui/PeruMap.tsx — Mapa coroplético reutilizable del Perú */

import { useState, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL =
  "https://raw.githubusercontent.com/juaneladio/peru-geojson/master/peru_departamental_simple.geojson";

export function normalizeRegion(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
  selectColor = "#1d4ed8",
  onSelect,
  height = "clamp(280px, 45vw, 500px)",
  bgColor = "#f0f9ff",
}: PeruMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const markerMap = new Map(markers.map(m => [m.zona, m]));

  return (
    <div
      ref={mapRef}
      className="relative w-full h-full rounded-xl overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onMouseMove={e => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
      }}
    >
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 bg-zinc-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap capitalize"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.name}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1850, center: [-75, -9.5] }}
        style={{ width: "100%", height }}
      >
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
                  stroke="white"
                  strokeWidth={isSelected ? 2.5 : 0.8}
                  style={{
                    default: {
                      outline: "none",
                      cursor: hasData ? "pointer" : "default",
                      transform: isSelected ? "scale(1.06)" : "scale(1)",
                      transformOrigin: "center",
                      transformBox: "fill-box",
                      transition: "transform 0.25s ease, fill 0.2s ease",
                      filter: isSelected ? "drop-shadow(0 3px 6px rgba(0,0,0,0.2))" : "none",
                    },
                    hover: {
                      outline: "none",
                      opacity: 0.85,
                      cursor: hasData ? "pointer" : "default",
                      transform: isSelected ? "scale(1.06)" : (hasData ? "scale(1.03)" : "scale(1)"),
                      transformOrigin: "center",
                      transformBox: "fill-box",
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

        {/* Marcadores numerados */}
        {markers.map(m => {
          const coords     = CENTROIDS_PERU[m.zona];
          if (!coords) return null;
          const isSelected = selected === m.zona;
          return (
            <Marker
              key={m.zona}
              coordinates={coords}
              onClick={() => onSelect?.(m.zona)}
            >
              <circle
                r={isSelected ? 17 : 13}
                fill={isSelected ? selectColor : "white"}
                fillOpacity={0.95}
                stroke={isSelected ? selectColor : "#d4d4d8"}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ cursor: "pointer" }}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize={isSelected ? 9 : 8}
                fontWeight={700}
                fill={isSelected ? "white" : "#18181b"}
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
