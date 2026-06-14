/** src/components/metricas/OrganicoTab.tsx */

import { GLASS_BASE, BADGE_BASE, INPUT_BASE, PANEL_BASE } from "../../lib/tokens";
import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Loader2, ExternalLink, Heart, MessageCircle, Bookmark, Eye, Play, Image, LayoutGrid, Building2, Link } from "lucide-react";
import { PostOrganico, MejorHora } from "../../types/instagramOrganico.types";
import {
  getPostsOrganicos, getMejoresHoras,
  syncInstagramOrganico, syncFacebookOrganico, syncTikTokOrganico,
  getTikTokEstado, getTikTokAuthUrl,
} from "../../services/instagramOrganico.api";
import { getMetaAuthUrl, getMetaEstado } from "../../services/metaOAuth.api";
import { getEmpresasConCuentas } from "../../services/plataformaCuentas.api";
import { MejoresHorasHeatmap } from "./MejoresHorasHeatmap";

type TipoFiltro    = "TODOS" | "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL_ALBUM";
type Orden         = "engagement" | "alcance" | "guardados" | "reciente";
type PlataformaOrg = "todas" | "instagram" | "facebook" | "tiktok";

const TIPO_LABEL: Record<string, string> = {
  IMAGE:          "Imagen",
  VIDEO:          "Video",
  REELS:          "Reel",
  CAROUSEL_ALBUM: "Carrusel",
};

const TIPO_ICON: Record<string, React.ReactNode> = {
  IMAGE:          <Image size={11} />,
  VIDEO:          <Play size={11} />,
  REELS:          <Play size={11} />,
  CAROUSEL_ALBUM: <LayoutGrid size={11} />,
};

const TIPO_COLOR: Record<string, string> = {
  IMAGE:          "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  VIDEO:          "bg-pink-500/15 text-pink-300 border border-pink-500/30",
  REELS:          "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30",
  CAROUSEL_ALBUM: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};

const PLATAFORMA_COLOR: Record<string, string> = {
  instagram: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  facebook:  "bg-blue-500/15 text-blue-300 border-blue-500/30",
  tiktok:    "bg-white/10 text-zinc-200 border-white/20",
};

const PLATAFORMA_LABEL: Record<PlataformaOrg, string> = {
  todas:     "Todas",
  instagram: "Instagram",
  facebook:  "Facebook",
  tiktok:    "TikTok",
};

const n = (v: number | string) => Number(v) || 0;

function fmtNum(v: number | string): string {
  const num = n(v);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function PostCard({ post }: { post: PostOrganico }) {
  const tipo   = post.tipo_contenido ?? "IMAGE";
  const color  = TIPO_COLOR[tipo]  ?? "bg-white/[0.06] text-zinc-400";
  const icon   = TIPO_ICON[tipo]   ?? <Image size={11} />;
  const label  = TIPO_LABEL[tipo]  ?? tipo;
  const esVideo   = tipo === "VIDEO" || tipo === "REELS";
  const eng       = n(post.tasa_engagement);
  const alcance   = n(post.alcance);
  const mgusta    = n(post.me_gusta);
  const coments   = n(post.comentarios);
  const guardados = n(post.guardados);
  const repros    = n(post.reproducciones);

  return (
    <div className={`${GLASS_BASE} hover:shadow-md transition overflow-hidden flex flex-col`}>
      {/* Miniatura */}
      <div className="relative aspect-square bg-white/[0.04] overflow-hidden">
        {post.url_media ? (
          <img
            src={post.url_media}
            alt={post.descripcion?.slice(0, 60) ?? "Post"}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <Image size={32} />
          </div>
        )}
        {/* Badge tipo */}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${color}`}>
          {icon} {label}
        </span>
        {/* Plataforma badge */}
        <span className={`absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${PLATAFORMA_COLOR[post.plataforma] ?? "bg-zinc-800 text-zinc-400 border-white/10"}`}>
          {post.plataforma}
        </span>
        {/* Link externo */}
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 p-1 bg-black/40 hover:bg-black/60 rounded-md text-white transition"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {post.descripcion && (
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {post.descripcion}
          </p>
        )}

        <p className="text-[10px] text-zinc-400 mt-auto">{fmtFecha(post.publicado_en)}</p>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1 text-zinc-400">
            <Eye size={11} className="text-zinc-400 shrink-0" />
            <span className="font-medium">{fmtNum(alcance)}</span>
            <span className="text-zinc-400">alcance</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <Heart size={11} className="text-pink-400 shrink-0" />
            <span className="font-medium">{fmtNum(mgusta)}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <MessageCircle size={11} className="text-blue-400 shrink-0" />
            <span className="font-medium">{fmtNum(coments)}</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <Bookmark size={11} className="text-amber-400 shrink-0" />
            <span className="font-medium">{fmtNum(guardados)}</span>
          </div>
          {esVideo && repros > 0 && (
            <div className="flex items-center gap-1 text-zinc-400 col-span-2">
              <Play size={11} className="text-fuchsia-400 shrink-0" />
              <span className="font-medium">{fmtNum(repros)}</span>
              <span className="text-zinc-400">reproducciones</span>
            </div>
          )}
        </div>

        {Number(post.tasa_engagement) > 0 && (
          <div className="mt-1">
            <span className={`${BADGE_BASE} text-[10px] font-semibold px-2 py-0.5 ${ Number(post.tasa_engagement) >= 5 ? "bg-emerald-500/15 text-emerald-300" : Number(post.tasa_engagement) >= 2 ? "bg-amber-500/15 text-amber-300" : "bg-white/[0.06] text-zinc-400" }`}>
              {Number(post.tasa_engagement).toFixed(2)}% engagement
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface SyncState {
  cargando: boolean;
  msg: string | null;
}

interface Props {
  empresa?: string;
}

export function OrganicoTab({ empresa: empresaProp }: Props) {
  const [empresas,       setEmpresas]       = useState<string[]>([]);
  const [empresaLocal,   setEmpresaLocal]   = useState<string>("");
  const empresa = empresaProp || empresaLocal || undefined;

  const [posts,          setPosts]          = useState<PostOrganico[]>([]);
  const [horas,          setHoras]          = useState<MejorHora[]>([]);
  const [cargando,       setCargando]       = useState(false);
  const [tipoFiltro,     setTipoFiltro]     = useState<TipoFiltro>("TODOS");
  const [orden,          setOrden]          = useState<Orden>("engagement");
  const [vistaHoras,     setVistaHoras]     = useState(false);
  const [platFiltro,     setPlatFiltro]     = useState<PlataformaOrg>("todas");
  const [syncIG,         setSyncIG]         = useState<SyncState>({ cargando: false, msg: null });
  const [syncFB,         setSyncFB]         = useState<SyncState>({ cargando: false, msg: null });
  const [syncTT,         setSyncTT]         = useState<SyncState>({ cargando: false, msg: null });
  const [tiktokConectado, setTiktokConectado] = useState<boolean | null>(null);
  const [metaConectado,   setMetaConectado]   = useState<boolean | null>(null);
  const [conectandoTT,    setConectandoTT]    = useState(false);
  const [conectandoMeta,  setConectandoMeta]  = useState(false);

  // Cargar lista de empresas configuradas
  useEffect(() => {
    getEmpresasConCuentas().then(setEmpresas).catch(() => {});

    const params = new URLSearchParams(window.location.search);

    // Detectar callback de TikTok OAuth
    if (params.get("tiktok_conectado") === "1") {
      const emp = params.get("empresa") || "";
      setSyncTT({ cargando: false, msg: "✓ TikTok conectado exitosamente" });
      window.history.replaceState({}, "", window.location.pathname);
      if (emp) setEmpresaLocal(emp);
    }
    if (params.get("tiktok_error")) {
      setSyncTT({ cargando: false, msg: params.get("tiktok_error") || "Error al conectar TikTok" });
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Detectar callback de Meta OAuth (Facebook/Instagram)
    if (params.get("meta_conectado") === "1") {
      const emp = params.get("empresa") || "";
      setSyncIG({ cargando: false, msg: "✓ Facebook/Instagram conectado" });
      setMetaConectado(true);
      window.history.replaceState({}, "", window.location.pathname);
      if (emp) setEmpresaLocal(emp);
    }
    if (params.get("meta_error")) {
      setSyncIG({ cargando: false, msg: params.get("meta_error") || "Error al conectar Facebook" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const plat = platFiltro === "todas" ? undefined : platFiltro;
      const [p, h] = await Promise.all([
        getPostsOrganicos(empresa, plat),
        getMejoresHoras(empresa, plat),
      ]);
      setPosts(p);
      setHoras(h);
    } catch {} finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [empresa, platFiltro]);

  useEffect(() => {
    if (!empresa) { setTiktokConectado(null); setMetaConectado(null); return; }
    getTikTokEstado(empresa)
      .then(r => setTiktokConectado(r.conectado))
      .catch(() => setTiktokConectado(false));
    getMetaEstado(empresa)
      .then(r => setMetaConectado(r.conectado))
      .catch(() => setMetaConectado(false));
  }, [empresa]);

  const handleSync = async (
    plat: "instagram" | "facebook" | "tiktok",
    setter: React.Dispatch<React.SetStateAction<SyncState>>,
    fn: (empresa: string) => Promise<any>
  ) => {
    if (!empresa) return;
    setter({ cargando: true, msg: null });
    try {
      const r = await fn(empresa);
      const paginas = r.paginas?.length ? ` · ${r.paginas.join(", ")}` : "";
      setter({ cargando: false, msg: `✓ ${r.insertados} nuevos · ${r.actualizados} actualizados${paginas}` });
      cargar();
    } catch (err: any) {
      setter({ cargando: false, msg: err.response?.data?.message || "Error al sincronizar" });
    }
  };

  const tiposDisponibles = useMemo(() =>
    [...new Set(posts.map(p => p.tipo_contenido))].filter(Boolean),
    [posts]
  );

  const postsFiltrados = useMemo(() => {
    let base = tipoFiltro === "TODOS" ? posts : posts.filter(p => p.tipo_contenido === tipoFiltro);
    return [...base].sort((a, b) => {
      if (orden === "engagement") return n(b.tasa_engagement) - n(a.tasa_engagement);
      if (orden === "alcance")    return n(b.alcance) - n(a.alcance);
      if (orden === "guardados")  return n(b.guardados) - n(a.guardados);
      return new Date(b.publicado_en).getTime() - new Date(a.publicado_en).getTime();
    });
  }, [posts, tipoFiltro, orden]);

  const kpis = useMemo(() => {
    if (!posts.length) return null;
    const total    = posts.length;
    const alcance  = Math.round(posts.reduce((s, p) => s + n(p.alcance), 0) / total);
    const eng      = parseFloat((posts.reduce((s, p) => s + n(p.tasa_engagement), 0) / total).toFixed(2));
    const guardados = Math.round(posts.reduce((s, p) => s + n(p.guardados), 0) / total);
    return { total, alcance, eng, guardados };
  }, [posts]);

  const handleConectarMeta = async () => {
    if (!empresa) return;
    setConectandoMeta(true);
    try {
      const url = await getMetaAuthUrl(empresa, "organico");
      window.location.href = url;
    } catch (err: any) {
      setSyncIG({ cargando: false, msg: err.response?.data?.message || "Error al conectar Facebook" });
      setConectandoMeta(false);
    }
  };

  const handleConectarTikTok = async () => {
    if (!empresa) return;
    setConectandoTT(true);
    try {
      const url = await getTikTokAuthUrl(empresa);
      window.location.href = url;
    } catch (err: any) {
      setSyncTT({ cargando: false, msg: err.response?.data?.message || "Error al obtener URL de TikTok" });
      setConectandoTT(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Contenido Orgánico</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Posts, reels, videos e historias con métricas individuales</p>
          </div>
          {/* Selector de empresa (cuando no viene del filtro externo) */}
          {!empresaProp && (
            <div className={`${PANEL_BASE} flex items-center gap-1.5 px-3 py-1.5`}>
              <Building2 size={13} className="text-zinc-400 shrink-0" />
              <select
                value={empresaLocal}
                onChange={e => setEmpresaLocal(e.target.value)}
                className="text-xs text-zinc-300 focus:outline-none bg-transparent min-w-[160px]"
              >
                <option value="">Selecciona empresa…</option>
                {empresas.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setVistaHoras(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition ${
              vistaHoras
                ? "bg-accent-15 border-accent-30 text-accent"
                : "bg-white/[0.04] border-white/10 text-zinc-400 hover:border-white/15"
            }`}
          >
            Mejores horas
          </button>
          {/* Instagram + Facebook — siempre se puede conectar/reconectar vía OAuth */}
          {empresa && (
            <>
              <div className="flex flex-col items-end gap-0.5">
                <button
                  onClick={handleConectarMeta}
                  disabled={conectandoMeta}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                >
                  {conectandoMeta
                    ? <><Loader2 size={12} className="animate-spin" /> Conectando…</>
                    : <><Link size={12} /> {metaConectado ? "Reconectar Facebook" : "Conectar con Facebook"}</>
                  }
                </button>
                {syncIG.msg && (
                  <span className={`text-[10px] font-medium max-w-[200px] text-right ${syncIG.msg.startsWith("✓") ? "text-emerald-400" : "text-red-500"}`}>
                    {syncIG.msg}
                  </span>
                )}
              </div>

              {/* Botones de sync — solo aparecen si ya está conectado vía OAuth */}
              {metaConectado === true && (
                <>
                  {[
                    { key: "instagram" as const, label: "Instagram", state: syncIG, setter: setSyncIG, fn: syncInstagramOrganico, color: "bg-fuchsia-600 hover:bg-fuchsia-700" },
                    { key: "facebook"  as const, label: "Facebook",  state: syncFB, setter: setSyncFB, fn: syncFacebookOrganico,  color: "bg-blue-600 hover:bg-blue-700"     },
                  ].map(btn => (
                    <div key={btn.key} className="flex flex-col items-end gap-0.5">
                      <button
                        onClick={() => handleSync(btn.key, btn.setter, btn.fn)}
                        disabled={btn.state.cargando}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-lg transition disabled:opacity-50 ${btn.color}`}
                      >
                        {btn.state.cargando
                          ? <><Loader2 size={12} className="animate-spin" /> {btn.label}…</>
                          : <><RefreshCw size={12} /> {btn.label}</>
                        }
                      </button>
                      {btn.state.msg && (
                        <span className={`text-[10px] font-medium max-w-[180px] text-right ${btn.state.msg.startsWith("✓") ? "text-emerald-400" : "text-red-500"}`}>
                          {btn.state.msg}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* TikTok — conectar o sincronizar según estado */}
          {empresa && (
            <div className="flex flex-col items-end gap-0.5">
              {tiktokConectado ? (
                <button
                  onClick={() => handleSync("tiktok", setSyncTT, syncTikTokOrganico)}
                  disabled={syncTT.cargando}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50"
                >
                  {syncTT.cargando
                    ? <><Loader2 size={12} className="animate-spin" /> TikTok…</>
                    : <><RefreshCw size={12} /> TikTok</>
                  }
                </button>
              ) : (
                <button
                  onClick={handleConectarTikTok}
                  disabled={conectandoTT}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50"
                >
                  {conectandoTT
                    ? <><Loader2 size={12} className="animate-spin" /> Conectando…</>
                    : <><Link size={12} /> Conectar TikTok</>
                  }
                </button>
              )}
              {syncTT.msg && (
                <span className={`text-[10px] font-medium max-w-[200px] text-right ${syncTT.msg.startsWith("✓") ? "text-emerald-400" : "text-red-500"}`}>
                  {syncTT.msg}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap mejores horas */}
      {vistaHoras && (
        <div className={`${GLASS_BASE} p-5`}>
          <p className="text-sm font-semibold text-zinc-200 mb-4">Mejores horas para publicar</p>
          <MejoresHorasHeatmap datos={horas} />
        </div>
      )}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total posts",       value: kpis.total,           color: "text-zinc-100"   },
            { label: "Alcance promedio",  value: fmtNum(kpis.alcance), color: "text-sky-300"    },
            { label: "Engagement prom.",  value: `${kpis.eng}%`,       color: "text-violet-300" },
            { label: "Guardados prom.",   value: fmtNum(kpis.guardados), color: "text-amber-300" },
          ].map(k => (
            <div key={k.label} className={`${GLASS_BASE} px-4 py-3`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {/* Filtro plataforma */}
          <div className="flex gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
            {(["todas", "instagram", "facebook", "tiktok"] as PlataformaOrg[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatFiltro(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  platFiltro === p ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {PLATAFORMA_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Filtro tipo */}
          {tiposDisponibles.length > 1 && (
            <div className="flex gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
              {(["TODOS", ...tiposDisponibles] as TipoFiltro[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoFiltro(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tipoFiltro === t ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t === "TODOS" ? "Todos" : (TIPO_LABEL[t] ?? t)}
                  {t !== "TODOS" && (
                    <span className="ml-1 text-zinc-400">
                      ({posts.filter(p => p.tipo_contenido === t).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orden */}
        <select
          value={orden}
          onChange={e => setOrden(e.target.value as Orden)}
          className={`${INPUT_BASE} text-xs px-2 py-1.5 text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30`}
        >
          <option value="engagement">Mayor engagement</option>
          <option value="alcance">Mayor alcance</option>
          <option value="guardados">Más guardados</option>
          <option value="reciente">Más recientes</option>
        </select>
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="flex items-center justify-center py-16 text-zinc-400 gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando posts…</span>
        </div>
      ) : postsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
            <Image size={24} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">Sin contenido orgánico</p>
            <p className="text-[12px] text-zinc-500 mt-1">
              {empresa
                ? "Usa los botones de sincronización para importar el contenido"
                : "Selecciona una empresa para ver su contenido"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {postsFiltrados.map(post => (
            <PostCard key={`${post.plataforma}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
