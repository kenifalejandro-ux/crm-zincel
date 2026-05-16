/**client/src/router/idex.tsx */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage      from "../pages/LoginPage";
import DashboardPage  from "../pages/DashboardPage";
import ProspectosPage from "../pages/ProspectosPage";
import LlamadasPage   from "../pages/LlamadasPage";
import ReunionesPage  from "../pages/ReunionesPage";
import FinanzasPage   from "../pages/FinanzasPage";
import BrochuresPage  from "../pages/BrochuresPage";
import { lLayout as Layout } from "../components/layout/lLayout";
import PerfilPage from "../pages/PerfilPage";
import MetricasPage from "../pages/MetricasPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, cargando } = useAuth();
  if (cargando) return (
    <div className="flex  items-center justify-center h-screen">
      <div className="animate-spin  rounded-full h-10 w-10 border-b-2 border-blue-600"/>
    </div>
  );
  return estaAutenticado ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  const { estaAutenticado } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={estaAutenticado ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index        element={<DashboardPage />} />
          <Route path="prospectos" element={<ProspectosPage />} />
          <Route path="llamadas"   element={<LlamadasPage />} />
          <Route path="reuniones"  element={<ReunionesPage />} />
          <Route path="finanzas"   element={<FinanzasPage />} />
          <Route path="brochures"  element={<BrochuresPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="/metricas" element={<MetricasPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}