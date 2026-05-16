/** client/src/components/prospectos/PreviewImportacion.tsx */

import { CheckCircle } from "lucide-react";
import { COLOR_ESTADO } from "../../utils/prospectos.mappers";

interface Props {
  preview: any[];
  importando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export function PreviewImportacion({ preview, importando, onCancelar, onConfirmar }: Props) {
  if (preview.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-zinc-800">
            Vista previa — {preview.length} registros detectados
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Revisa los datos antes de confirmar la importación
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={importando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
          >
            <CheckCircle size={14} />
            {importando ? "Importando..." : "Confirmar importación"}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-auto max-h-64">
        <table className="min-w-[1400px] text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">#</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Empresa</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Contacto</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Teléfono</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Email</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Estado</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Ciudad</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">País</th>
              <th className="text-left px-3 py-2 text-zinc-500 font-medium">Llamadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {preview.slice(0, 400).map((p, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-zinc-800">{p.empresa}</td>
                <td className="px-3 py-2 text-gray-600">{p.nombre_contacto || "-"}</td>
                <td className="px-3 py-2 text-gray-600">{p.telefono || "-"}</td>
                <td className="px-3 py-2 text-gray-600 max-w-[180px] truncate">{p.email_contacto || "-"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${COLOR_ESTADO[p.estado_lead] || "bg-gray-100 text-gray-500"}`}>
                    {p.estado_lead}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-500">{p.ciudad || "-"}</td>
                <td className="px-3 py-2 text-zinc-500">{p.pais || "-"}</td>
                <td className="px-3 py-2 text-zinc-500">
                  {p.llamadas && p.llamadas.length > 0 ? (
                    <div className="text-xs">
                      {p.llamadas.length} llamada{p.llamadas.length > 1 ? "s" : ""}
                      {p.llamadas.length <= 2 && (
                        <div className="text-zinc-400 mt-0.5">
                          {p.llamadas.map((ll: any, idx: number) => (
                            <div key={idx}>
                              {new Date(ll.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : "-"}
                </td>
              </tr>
            ))}
            {preview.length > 400 && (
              <tr>
                <td colSpan={9} className="px-3 py-2 text-xs text-zinc-400 text-center">
                  Mostrando 400 de {preview.length} registros — todos se importarán
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}