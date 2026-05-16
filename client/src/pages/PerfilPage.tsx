/**client/src/pages/PerfilPage.tsx */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { cambiarPasswordApi } from "../services/auth.api";
import { User, Lock, CheckCircle } from "lucide-react";

export default function PerfilPage() {
  const { usuario } = useAuth();
  const [form, setForm] = useState({
    password_actual: "",
    password_nuevo:  "",
    password_confirmar: "",
  });
  const [cargando, setCargando]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [exito, setExito]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (form.password_nuevo !== form.password_confirmar) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (form.password_nuevo.length < 6) {
      setError("La nueva contraseña debe tener mínimo 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      await cambiarPasswordApi(form.password_actual, form.password_nuevo);
      setExito(true);
      setForm({ password_actual: "", password_nuevo: "", password_confirmar: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      <div>
        <h1 className="text-xl font-semibold text-zinc-800">Mi perfil</h1>
        <p className="text-xs text-zinc-800 mt-0.5">Gestiona tu información y contraseña</p>
      </div>

      {/* Info usuario */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-zinc-800 text-lg">{usuario?.nombre}</p>
            <p className="text-xs text-zinc-800">{usuario?.email}</p>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-zinc-800 capitalize mt-1">
              {usuario?.rol}
            </span>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-zinc-800" />
          <h2 className="text-base font-semibold text-zinc-800">Cambiar contraseña</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium gray-100 mb-1 block">
              Contraseña actual
            </label>
            <input
              type="password"
              value={form.password_actual}
              onChange={e => setForm(f => ({ ...f, password_actual: e.target.value }))}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-xs
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium gray-100 mb-1 block">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={form.password_nuevo}
              onChange={e => setForm(f => ({ ...f, password_nuevo: e.target.value }))}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-xs
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium gray-100 mb-1 block">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={form.password_confirmar}
              onChange={e => setForm(f => ({ ...f, password_confirmar: e.target.value }))}
              required
              placeholder="Repite la nueva contraseña"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-xs
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {exito && (
            <div className="bg-green-50 border border-green-100 text-green-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} />
              Contraseña actualizada correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-zinc-800 font-medium py-2.5 rounded-lg text-xs transition"
          >
            {cargando ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>

    </div>
  );
}