/** client/src/components/whatsapp/ModalWhatsApp.tsx */

import { MODAL_BASE, INPUT_BASE } from "../../lib/tokens";
import { useState, useEffect } from "react";
import { X, MessageCircle, Send, Loader2, Clock, CheckCheck } from "lucide-react";
import { enviarWhatsApp, obtenerHistorialWA } from "../../services/whatsapp.api";

interface Props {
  open:        boolean;
  onClose:     () => void;
  nombre:      string;
  telefono:    string;
  prospectoId: string;
  empresa?:    string;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function ModalWhatsApp({ open, onClose, nombre, telefono, prospectoId, empresa }: Props) {
  const [mensaje,   setMensaje]   = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [ok,        setOk]        = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    setMensaje("");
    setError(null);
    setOk(false);
    obtenerHistorialWA(prospectoId).then(setHistorial).catch(() => {});
  }, [open, prospectoId]);

  const handleEnviar = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      await enviarWhatsApp(telefono, mensaje.trim(), prospectoId, empresa);
      setOk(true);
      setMensaje("");
      obtenerHistorialWA(prospectoId).then(setHistorial).catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  };

  if (!open) return null;

  const SUGERENCIAS = [
    `Hola ${nombre}, te contactamos de Zincel Ideas. ¿Tienes un momento para hablar sobre tu proyecto?`,
    `Hola ${nombre}, ¿cómo va todo? Queríamos hacer seguimiento a nuestra última conversación.`,
    `Hola ${nombre}, te enviamos la propuesta que conversamos. ¿Pudiste revisarla?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`${MODAL_BASE} w-full max-w-lg flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{nombre}</p>
              <p className="text-xs text-zinc-500">{telefono}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        {/* Historial */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 min-h-[120px]">
          {historial.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">Sin mensajes enviados aún</p>
          ) : (
            historial.map(m => (
              <div key={m.id} className="flex justify-end">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                  <p className="text-xs text-zinc-300">{m.contenido || m.template_nombre}</p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-[10px] text-zinc-400">{fmtFecha(m.creado_en)}</span>
                    <CheckCheck size={11} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sugerencias */}
        <div className="px-5 pb-2">
          <p className="text-[10px] text-zinc-400 mb-1.5 flex items-center gap-1">
            <Clock size={10} /> Mensajes rápidos
          </p>
          <div className="flex flex-col gap-1">
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                onClick={() => setMensaje(s)}
                className="text-left text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/40 hover:bg-zinc-800 px-3 py-1.5 rounded-lg truncate transition"
              >
                {s.slice(0, 70)}…
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2 border-t border-white/8">
          {ok && (
            <p className="text-xs text-emerald-600 font-medium mb-2">✓ Mensaje enviado correctamente</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <textarea
              value={mensaje}
              onChange={e => { setMensaje(e.target.value); setOk(false); setError(null); }}
              placeholder="Escribe un mensaje…"
              rows={3}
              className={`${INPUT_BASE} flex-1 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-300`}
            />
            <button
              onClick={handleEnviar}
              disabled={enviando || !mensaje.trim()}
              className="self-end px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
            >
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
