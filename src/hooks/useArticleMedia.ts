// hooks/useArticleMedia.ts
import { useState } from "react";
import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";

export function useArticleMedia(initial: ExistingMedia[] = []) {
  const [existing, setExisting] = useState(initial);
  const [added, setAdded] = useState<NewMedia[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

const addFiles = (files: FileList | null) => {
  if (!files) return;

  const items: NewMedia[] = Array.from(files).map((file) => {
    let kind: MediaKind;

    if (file.type.startsWith("image")) kind = "image";
    else if (file.type.startsWith("video")) kind = "video";
    else kind = "audio";

    return {
      file,
      url: URL.createObjectURL(file),
      kind,
      status: "uploading",
    };
  });

  setAdded((p) => [...p, ...items]);
};


  const removeExisting = (id: string) => {
    setExisting((p) => p.filter((m) => m.id !== id));
    setRemoved((p) => [...p, id]);
  };

  const removeAdded = (index: number) => {
    setAdded((p) => {
      URL.revokeObjectURL(p[index].url);
      return p.filter((_, i) => i !== index);
    });
  };

  return {
    existing,
    added,
    removed,
    setExisting,
    addFiles,
    removeExisting,
    removeAdded,
  };
}
