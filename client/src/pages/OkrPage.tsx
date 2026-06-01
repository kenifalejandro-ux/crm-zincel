/** client/src/pages/OkrPage.tsx */

import { OkrList } from "../components/okr/OkrList";

export default function OkrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">OKR Corporativos</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Objetivos estratégicos trimestrales — el CRM actualiza el progreso automáticamente
        </p>
      </div>

      <OkrList />
    </div>
  );
}
