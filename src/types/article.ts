export type MediaKind = "image" | "video" | "audio";

export interface ExistingMedia {
  id: string;
  url: string;
  kind: MediaKind;
  position: number;
}

export interface NewMedia {
  file: File;
  url: string;
  kind: MediaKind;
}
