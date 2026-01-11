"use client";

import styles from "./ArticleForm.module.css";
import { MediaKind } from "@/types/article";

interface MediaItemProps {
  url: string;
  kind: MediaKind;
}

export function MediaItem({ url, kind }: MediaItemProps) {
  if (kind === "image") {
    return (
      <img
        src={url}
        className={styles["article-media-preview-item"]}
        draggable={false}
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        controls
        className={styles["article-media-preview-item"]}
        draggable={false}
      />
    );
  }

  return (
    <audio
      src={url}
      controls
      className={styles["article-media-preview-item"]}
      draggable={false}
    />
  );
}
