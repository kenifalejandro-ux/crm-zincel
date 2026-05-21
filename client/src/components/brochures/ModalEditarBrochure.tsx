/** client/src/components/brochures/ModalEditarBrochure.tsx */

import { useState, useEffect } from "react";
import { ModalEditar } from "../ui/ModalEditar";
import { CANALES } from "./ResumenCanales";

interface Props {
  brochure:  any;
  guardando: boolean;
  error?:    string | null;
  onGuardar: (form: { canal: string; fecha_envio: string; notas: string }) => void;
  onCerrar:  () => void;
}

export function ModalEditarBrochure({ brochure, guardando, error, onGuardar, onCerrar }: Props) {
  const [canal,       setCanal]       = useState(brochure.canal ?? "correo");
  const [fecha_envio, setFechaEnvio]  = useState(brochure.fecha_envio?.split("T")[0] ?? "");
  const [notas,       setNotas]       = useState(brochure.notas ?? "");

  useEffect(() => {
    setCanal(brochure.canal ?? "correo");
    setFechaEnvio(brochure.fecha_envio?.split("T")[0] ?? "");
    setNotas(brochure.notas ?? "");
  }, [brochure]);

  const nombre = brochure.empresa
    ? `${brochure.empresa}${brochure.nombre_contacto ? ` — ${brochure.nombre_contacto}` : ""}`
    : "Brochure";

  return (
    <ModalEditar
      nombre={nombre}
      guardando={guardando}
      error={error}
      onGuardar={() => onGuardar({ canal, fecha_envio, notas })}
      onCerrar={onCerrar}
      size="md"
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha de envío</label>
          <input
            type="date"
            value={fecha_envio}
            onChange={(e) => setFechaEnvio(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Canal de envío</label>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CANALES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Notas</label>
          <textarea
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Enviado con propuesta de rediseño..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </ModalEditar>
  );
}
