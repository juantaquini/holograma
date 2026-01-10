import { Reorder } from "framer-motion";
import styles from "./EditArticle.module.css";
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
  const existingFiltered = existing.filter((m) => m.kind === kind);
  const addedFiltered = added.filter((m) => m.kind === kind);

  return (
    <section>
      <h3>{title}</h3>

      <Reorder.Group
        axis="x"
        values={existingFiltered}
        onReorder={(newOrder: ExistingMedia[]) => {
          setExisting((prev) => {
            const others = prev.filter((m) => m.kind !== kind);
            return [...others, ...newOrder];
          });
        }}
        className={styles["article-media-preview"]}
      >
        {existingFiltered.map((m) => (
          <Reorder.Item key={m.id} value={m}>
            <MediaItem url={m.url} kind={kind} />
            <button onClick={() => removeExisting(m.id)}>✕</button>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {addedFiltered.map((m, i) => (
        <div key={i}>
          <MediaItem url={m.url} kind={kind} />
          <button onClick={() => removeAdded(i)}>✕</button>
        </div>
      ))}

      <input
        type="file"
        multiple
        accept={`${kind}/*`}
        onChange={(e) => addFiles(e.target.files)}
      />
    </section>
  );
}
