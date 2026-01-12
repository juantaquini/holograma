"use client";

import { useMemo, useRef } from "react";
import { Reorder } from "framer-motion";
import { FiPlus } from "react-icons/fi";

import styles from "./ArticleForm.module.css";
import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";
import { MediaItem } from "./MediaItem";

interface Props {
  title: string;
  kind: MediaKind;

  existing: ExistingMedia[];
  added: NewMedia[];

  order: string[];
  setOrder: (ids: string[]) => void;

  removeExisting: (id: string) => void;
  removeAdded: (id: string) => void;
  addFiles: (files: FileList | null) => void;
}

export function MediaSection({
  title,
  kind,
  existing,
  added,
  order,
  setOrder,
  removeExisting,
  removeAdded,
  addFiles,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo(() => {
    return order
      .map(
        (id) =>
          existing.find((m) => m.id === id) ?? added.find((m) => m.id === id)
      )
      .filter((m): m is ExistingMedia | NewMedia => !!m && m.kind === kind);
  }, [order, existing, added, kind]);

  return (
    <section className={styles["media-section"]}>
      <h3>{title}</h3>

      <Reorder.Group
        axis="x"
        values={order}
        onReorder={setOrder}
        className={styles["article-media-preview"]}
      >
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item.id}
            className={styles["media-wrapper"]}
          >
            <MediaItem url={item.url} kind={kind} />

            <button
              type="button"
              className={styles["remove-button"]}
              onClick={() =>
                "position" in item
                  ? removeExisting(item.id)
                  : removeAdded(item.id)
              }
            >
              ✕
            </button>
          </Reorder.Item>
        ))}

        <div
          className={styles["article-media-preview-item"]}
          onClick={() => inputRef.current?.click()}
        >
          <FiPlus />
        </div>
      </Reorder.Group>
      {added
        .filter((m) => m.kind === kind && m.status === "uploading")
        .map((m) => (
          <div
            key={`uploading-${m.id}`}
            className={styles["article-media-preview-item"]}
          >
            Uploading...
          </div>
        ))}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={`${kind}/*`}
        className={styles["hidden-input"]}
        onChange={(e) => addFiles(e.target.files)}
      />
    </section>
  );
}
