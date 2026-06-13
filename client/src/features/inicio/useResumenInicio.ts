/** client/src/features/inicio/useResumenInicio.ts
 *  Hook de carga del resumen de inicio.
 */
import { useEffect, useState } from "react";
import { getResumenInicio, type ResumenInicio } from "../../services/inicio.api";

interface Estado {
  data: ResumenInicio | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

export function useResumenInicio(): Estado {
  const [data, setData] = useState<ResumenInicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    getResumenInicio()
      .then((d) => { if (vivo) { setData(d); setError(null); } })
      .catch(() => { if (vivo) setError("No se pudo cargar el resumen."); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [nonce]);

  return { data, cargando, error, recargar: () => setNonce((n) => n + 1) };
}
