export interface PostOrganico {
  id:               string;
  empresa:          string;
  plataforma:       "instagram" | "facebook" | "tiktok";
  post_id:          string;
  tipo_contenido:   "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS" | string;
  descripcion:      string | null;
  url_media:        string | null;
  permalink:        string | null;
  publicado_en:     string;
  alcance:          number;
  impresiones:      number;
  me_gusta:         number;
  comentarios:      number;
  compartidos:      number;
  guardados:        number;
  reproducciones:   number;
  watch_time_seg:   number;
  tasa_reproduccion: number;
  tasa_engagement:  number;
  creado_en:        string;
  actualizado_en:   string;
}

export interface MejorHora {
  dia_semana:          number;   // 0=Dom … 6=Sáb
  hora:                number;   // 0-23
  total_posts:         number;
  engagement_promedio: number;
  alcance_promedio:    number;
  likes_promedio:      number;
}
