/**client/src/pages/PlantillasPage.tsx */

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  getPlantillas, crearPlantilla, actualizarPlantilla, eliminarPlantilla,
} from "../services/plantillas.api";
import type { Plantilla, CanalPlantilla } from "../types/plantilla.types";

const CANAL_ICON: Record<CanalPlantilla, React.ReactNode> = {
  whatsapp: <span className="text-green-500 text-[10px] font-bold">WA</span>,
  correo:   <span className="text-blue-500  text-[10px] font-bold">✉</span>,
  ambos:    <span className="text-purple-500 text-[10px] font-bold">WA+✉</span>,
};

const CANAL_BADGE: Record<CanalPlantilla, string> = {
  whatsapp: "bg-green-100 text-green-700",
  correo:   "bg-blue-100 text-blue-700",
  ambos:    "bg-purple-100 text-purple-700",
};

const CANAL_LABEL: Record<CanalPlantilla, string> = {
  whatsapp: "WhatsApp",
  correo:   "Correo",
  ambos:    "WhatsApp + Correo",
};

const VARIABLES = ["{{empresa}}", "{{nombre}}", "{{telefono}}"];

const EJEMPLOS: Omit<Plantilla, "id" | "creado_en">[] = [
  {
    titulo:    "Primer contacto",
    canal:     "whatsapp",
    contenido: "Hola {{nombre}}, le saluda Kenif de Zincel Ideas 👋\n\nMe comunico con usted para presentarle nuestros servicios de desarrollo web y marketing digital para {{empresa}}.\n\n¿Tendría unos minutos para conversar esta semana?",
  },
  {
    titulo:    "Seguimiento post-llamada",
    canal:     "whatsapp",
    contenido: "Hola {{nombre}}, gracias por su tiempo en nuestra llamada de hoy 🙏\n\nSegún lo conversado, le haré llegar la propuesta para {{empresa}} a la brevedad.\n\nQuedo atento a cualquier consulta.",
  },
  {
    titulo:    "Envío de propuesta",
    canal:     "correo",
    contenido: "Estimado/a {{nombre}},\n\nEspero que se encuentre bien. Adjunto la propuesta comercial para {{empresa}} que conversamos.\n\nQuedo disponible para resolver cualquier duda y coordinar una reunión de seguimiento.\n\nSaludos,\nKenif\nZincel Ideas",
  },
  {
    titulo:    "Seguimiento sin respuesta",
    canal:     "whatsapp",
    contenido: "Hola {{nombre}}, espero que se encuentre bien 😊\n\nMe pongo en contacto nuevamente con {{empresa}} para saber si tuvo oportunidad de revisar nuestra propuesta.\n\n¿Le viene bien coordinar una llamada breve esta semana?",
  },
];

const FORM_VACIO = { titulo: "", canal: "whatsapp" as CanalPlantilla, contenido: "" };
const cls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function PlantillasPage() {
  const [plantillas,  setPlantillas]  = useState<Plantilla[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando,    setEditando]    = useState<Plantilla | null>(null);
  const [form,        setForm]        = useState({ ...FORM_VACIO });
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [copiado,     setCopiado]     = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try { setPlantillas(await getPlantillas()); }
    catch (err) { console.error(err); }
    finally { setCargando(false); }
  }

  function abrirNueva() {
    setEditando(null);
    setForm({ ...FORM_VACIO });
    setError(null);
    setMostrarForm(true);
  }

  function abrirEditar(p: Plantilla) {
    setEditando(p);
    setForm({ titulo: p.titulo, canal: p.canal, contenido: p.contenido });
    setError(null);
    setMostrarForm(true);
  }

  function insertarVariable(v: string) {
    setForm(f => ({ ...f, contenido: f.contenido + v }));
  }

  async function handleGuardar() {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("Título y contenido son obligatorios");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        await actualizarPlantilla(editando.id, form);
      } else {
        await crearPlantilla(form);
      }
      setMostrarForm(false);
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try { await eliminarPlantilla(id); cargar(); }
    catch (err) { console.error(err); }
  }

  async function usarEjemplo(ej: typeof EJEMPLOS[0]) {
    setGuardando(true);
    try { await crearPlantilla(ej); await cargar(); }
    catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "Error al guardar la plantilla");
    }
    finally { setGuardando(false); }
  }

  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-500" />
            Plantillas de mensaje
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Textos reutilizables con variables automáticas: {VARIABLES.join(", ")}
          </p>
        </div>
        <button
          onClick={abrirNueva}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus size={13} /> Nueva plantilla
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-700">
              {editando ? "Editar plantilla" : "Nueva plantilla"}
            </p>
            <button onClick={() => setMostrarForm(false)} className="text-zinc-400 hover:text-zinc-600">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Título</label>
              <input
                type="text" placeholder="Ej: Primer contacto"
                value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className={cls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">Canal</label>
              <select
                value={form.canal}
                onChange={e => setForm(f => ({ ...f, canal: e.target.value as CanalPlantilla }))}
                className={cls}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
                <option value="ambos">WhatsApp + Correo</option>
              </select>
            </div>
          </div>

          {/* Variables rápidas */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-zinc-400">Insertar:</span>
            {VARIABLES.map(v => (
              <button
                key={v}
                onClick={() => insertarVariable(v)}
                className="text-[10px] px-2 py-0.5 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition font-mono"
              >
                {v}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Contenido</label>
            <textarea
              rows={6} placeholder="Escribe el mensaje aquí..."
              value={form.contenido}
              onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
              className={`${cls} resize-none font-mono leading-relaxed`}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setMostrarForm(false)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition"
            >
              {guardando ? "Guardando..." : "Guardar plantilla"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de plantillas */}
      {cargando ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      ) : plantillas.length === 0 ? (
        <div className="space-y-4">
          <p className="text-center text-xs text-zinc-400 py-4">Aún no tienes plantillas. Crea una o usa estos ejemplos:</p>
          <div className="grid gap-3">
            {EJEMPLOS.map((ej, i) => (
              <div key={i} className="border border-dashed border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-zinc-700">{ej.titulo}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CANAL_BADGE[ej.canal]}`}>
                      {CANAL_LABEL[ej.canal]}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{ej.contenido}</p>
                </div>
                <button
                  onClick={() => usarEjemplo(ej)}
                  disabled={guardando}
                  className="shrink-0 px-2.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Usar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-800">{p.titulo}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CANAL_BADGE[p.canal]}`}>
                    {CANAL_LABEL[p.canal]}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copiar(p.contenido, p.id)}
                    title="Copiar"
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-gray-100 hover:text-zinc-700 transition"
                  >
                    {copiado === p.id ? <Check size={13} className="text-green-500" /> : <span className="text-[10px]">📋</span>}
                  </button>
                  <button
                    onClick={() => abrirEditar(p)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-gray-100 hover:text-zinc-700 transition"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleEliminar(p.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-100 hover:text-red-500 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 whitespace-pre-wrap leading-relaxed">{p.contenido}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
