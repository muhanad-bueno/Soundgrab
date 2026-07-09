export interface TrackMeta {
  id: string;
  title: string;
  uploader: string;
  duration?: number;
  thumbnail?: string;
  url?: string;
  webpage_url?: string;
}

export type UrlKind =
  | { type: "Single"; data: TrackMeta }
  | { type: "Playlist"; data: TrackMeta[] }
  | { type: "Invalid" };
