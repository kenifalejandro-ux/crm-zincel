/**client/src/components/plantillas/PlantillaSelector.tsx */

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, MessageSquare } from "lucide-react";
import { getPlantillas, personalizarPlantilla } from "../../services/plantillas.api";
import type { Plantilla } from "../../types/plantilla.types";
import { useNavigate } from "react-router-dom";

interface Props {
  empresa?:  string;
  nombre?:   string;
  telefono?: string;
}

const CANAL_BADGE: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700",
  correo:   "bg-blue-100 text-blue-700",
  ambos:    "bg-purple-100 text-purple-700",
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  correo:   "Correo",
  ambos:    "WA + Correo",
};

export function PlantillaSelector({ empresa, nombre, telefono }: Props) {
  const navigate = useNavigate();
  const [plantillas,   setPlantillas]   = useState<Plantilla[]>([]);
  const [seleccionada, setSeleccionada] = useState<Plantilla | null>(null);
  const [copiado,      setCopiado]      = useState(false);
  const [cargando,     setCargando]     = useState(true);

  useEffect(() => {
    getPlantillas()
      .then(setPlantillas)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const vars = { empresa, nombre, telefono };

  const textoPrev = seleccionada
    ? personalizarPlantilla(seleccionada.contenido, vars)
    : null;

  function copiar() {
    if (!textoPrev) return;
    navigator.clipboard.writeText(textoPrev);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function abrirWhatsApp() {
    if (!textoPrev || !telefono) return;
    const num  = telefono.replace(/\D/g, "");
    const full = num.startsWith("51") ? num : `51${num}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(textoPrev)}`, "_blank");
  }

  if (cargando) return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
    </div>
  );

  if (plantillas.length === 0) return (
    <div className="text-center py-10 space-y-3">
      <MessageSquare size={28} className="mx-auto text-zinc-300" />
      <p className="text-xs text-zinc-400">Aún no tienes plantillas creadas</p>
      <button
        onClick={() => navigate("/plantillas")}
        className="text-xs text-indigo-500 hover:text-indigo-700 underline"
      >
        Crear plantillas →
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Datos del prospecto */}
      <div className="bg-gray-50 rounded-xl p-3 flex gap-4 text-xs text-zinc-600 flex-wrap">
        <span><span className="text-zinc-400">Empresa:</span> <strong>{empresa ?? "—"}</strong></span>
        <span><span className="text-zinc-400">Contacto:</span> <strong>{nombre ?? "—"}</strong></span>
        <span><span className="text-zinc-400">Teléfono:</span> <strong>{telefono ?? "—"}</strong></span>
      </div>

      {/* Grid de plantillas */}
      <div className="grid grid-cols-2 gap-2">
        {plantillas.map(p => (
          <button
            key={p.id}
            onClick={() => setSeleccionada(prev => prev?.id === p.id ? null : p)}
            className={`text-left px-3 py-2.5 rounded-xl border text-xs transition ${
              seleccionada?.id === p.id
                ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium shadow-sm"
                : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 text-zinc-600"
            }`}
          >
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-medium mb-1 ${CANAL_BADGE[p.canal]}`}>
              {CANAL_LABEL[p.canal]}
            </span>
            <p className="font-medium truncate">{p.titulo}</p>
          </button>
        ))}
      </div>

      {/* Preview personalizado */}
      {seleccionada && textoPrev && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-700">{seleccionada.titulo}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CANAL_BADGE[seleccionada.canal]}`}>
              {CANAL_LABEL[seleccionada.canal]}
            </span>
          </div>
          <p className="text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3">
            {textoPrev}
          </p>
          <div className="flex gap-2">
            <button
              onClick={copiar}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
                copiado
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-gray-200 hover:bg-gray-50 text-zinc-600"
              }`}
            >
              {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar texto</>}
            </button>
            {(seleccionada.canal === "whatsapp" || seleccionada.canal === "ambos") && telefono && (
              <button
                onClick={abrirWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
              >
                <ExternalLink size={12} /> Abrir WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
