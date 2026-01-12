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
  setExisting: React.Dispatch<React.SetStateAction<ExistingMedia[]>>;
  removeExisting: (id: string) => void;
  added: NewMedia[];
  removeAdded: (index: number) => void;
  addFiles: (files: FileList | null) => void;
}

type MediaUIItem =
  | {
      source: "existing";
      id: string;
      url: string;
      kind: MediaKind;
    }
  | {
      source: "new";
      url: string;
      kind: MediaKind;
      addedIndex: number;
    };

export function MediaSection({
  title,
  kind,
  existing,
  setExisting,
  removeExisting,
  added,
  removeAdded,
  addFiles,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items: MediaUIItem[] = useMemo(() => {
    const existingItems: MediaUIItem[] = existing
      .filter((m) => m.kind === kind)
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        source: "existing",
        id: m.id,
        url: m.url,
        kind: m.kind,
      }));

    const newItems: MediaUIItem[] = added
      .filter((m) => m.kind === kind && m.status === "ready")
      .map((m, index) => ({
        source: "new",
        url: m.url,
        kind: m.kind,
        addedIndex: index,
      }));

    return [...existingItems, ...newItems];
  }, [existing, added, kind]);

  return (
    <section className={styles["media-section"]}>
      <h3>{title}</h3>

      <Reorder.Group
        axis="x"
        values={items}
        className={styles["article-media-preview"]}
        onReorder={(newOrder: MediaUIItem[]) => {
          // 🔹 EXISTING
          setExisting((prev) => {
            const others = prev.filter((m) => m.kind !== kind);

            const reorderedExisting = newOrder
              .filter((i) => i.source === "existing")
              .map((item, index) => {
                const original = prev.find(
                  (m) => m.id === item.id
                )!;

                return {
                  ...original,
                  position: index,
                };
              });

            return [...others, ...reorderedExisting];
          });

          // 🔹 NEW
          const reorderedAdded = newOrder.filter(
            (i) => i.source === "new"
          );

          reorderedAdded.forEach((item, newIndex) => {
            if (item.addedIndex !== newIndex) {
              removeAdded(item.addedIndex);
            }
          });
        }}
      >
        {items.map((item) => (
          <Reorder.Item
            key={
              item.source === "existing"
                ? `existing-${item.id}`
                : `new-${item.addedIndex}-${item.url}`
            }
            value={item}
            drag={false}
            dragListener={false}
            className={styles["media-wrapper"]}
          >
            <MediaItem url={item.url} kind={kind} />

            <button
              type="button"
              className={styles["remove-button"]}
              onClick={() =>
                item.source === "existing"
                  ? removeExisting(item.id)
                  : removeAdded(item.addedIndex)
              }
            >
              ✕
            </button>
          </Reorder.Item>
        ))}

        {/* ADD */}
        <div
          className={styles["article-media-preview-item"]}
          onClick={() => inputRef.current?.click()}
        >
          <FiPlus />
        </div>
      </Reorder.Group>

      {/* UPLOADING */}
      {added
        .filter((m) => m.kind === kind && m.status === "uploading")
        .map((_, i) => (
          <div
            key={`uploading-${i}`}
            className={styles["article-media-preview-item"]}
          >
            Subiendo…
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
