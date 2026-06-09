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
import MetricasPage      from "../pages/MetricasPage";
import ConfiguracionPage from "../pages/ConfiguracionPage";
import TareasPage        from "../pages/TareasPage";
import PipelinePage      from "../pages/PipelinePage";
import PlantillasPage    from "../pages/PlantillasPage";
import InteligenciaPage  from "../pages/InteligenciaPage";
import InicioPage        from "../pages/InicioPage";
import ObjetivosPage          from "../pages/ObjetivosPage";
import OkrPage                from "../pages/OkrPage";
import AnalisisIntentosPage   from "../pages/AnalisisIntentosPage";
import AnalisisComercialPage  from "../pages/AnalisisComercialPage";
import JornadaPage            from "../pages/JornadaPage";
import ResultadosPage         from "../pages/ResultadosPage";
import SegundaVueltaPage     from "../pages/SegundaVueltaPage";

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
          <Route index              element={<Navigate to="/inicio" replace />} />
          <Route path="inicio"      element={<InicioPage />} />
          <Route path="analisis"    element={<DashboardPage />} />
          <Route path="prospectos"  element={<ProspectosPage />} />
          <Route path="llamadas"   element={<LlamadasPage />} />
          <Route path="reuniones"  element={<ReunionesPage />} />
          <Route path="finanzas"   element={<FinanzasPage />} />
          <Route path="brochures"  element={<BrochuresPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="/metricas"        element={<MetricasPage />} />
          <Route path="/configuracion"   element={<ConfiguracionPage />} />
          <Route path="/tareas"          element={<TareasPage />} />
          <Route path="/pipeline"        element={<PipelinePage />} />
          <Route path="/plantillas"      element={<PlantillasPage />} />
          <Route path="/inteligencia"    element={<InteligenciaPage />} />
          <Route path="/objetivos"            element={<ObjetivosPage />} />
          <Route path="/okr"                element={<OkrPage />} />
          <Route path="/analisis-llamadas"   element={<AnalisisIntentosPage />} />
          <Route path="/analisis-comercial" element={<AnalisisComercialPage />} />
          <Route path="/jornada"            element={<JornadaPage />} />
          <Route path="/resultados"         element={<ResultadosPage />} />
          <Route path="/segunda-vuelta"     element={<SegundaVueltaPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}