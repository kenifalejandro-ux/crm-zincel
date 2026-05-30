/** client/src/components/brochures/ModalEditarBrochure.tsx */

import { useState, useEffect } from "react";
import { Modal }  from "../ui/Modal";
import { Button } from "../ui/Button";
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

  const inp = "w-full px-3 py-2 text-xs bg-zinc-900/50 border border-zinc-600 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand/50 [color-scheme:dark]";
  const lbl = "text-xs font-medium text-zinc-400 mb-1 block";

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Editar — ${nombre}`} variant="dark" size="md">
      <div className="space-y-4">

        <div>
          <label className={lbl}>Fecha de envío</label>
          <input type="date" value={fecha_envio}
            onChange={e => setFechaEnvio(e.target.value)}
            className={inp} />
        </div>

        <div>
          <label className={lbl}>Canal de envío</label>
          <select value={canal} onChange={e => setCanal(e.target.value)} className={inp}>
            {CANALES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        <div>
          <label className={lbl}>Notas</label>
          <textarea rows={3} value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Ej: Enviado con propuesta de rediseño..."
            className={`${inp} resize-none`} />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-1 border-t border-zinc-700">
          <Button variant="secondary" className="flex-1" onClick={onCerrar}>Cancelar</Button>
          <Button className="flex-1" loading={guardando} onClick={() => onGuardar({ canal, fecha_envio, notas })}>
            Guardar cambios
          </Button>
        </div>

      </div>
    </Modal>
  );
}
