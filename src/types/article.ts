export type MediaKind = "image" | "video" | "audio";

export interface BaseMedia {
  id: string;
  url: string;
  kind: MediaKind;
}

export interface ExistingMedia extends BaseMedia {
  position: number;
}

export interface NewMedia {
  file: File;
  url: string;
  kind: MediaKind;
}
