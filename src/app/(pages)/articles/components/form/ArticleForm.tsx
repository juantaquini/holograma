"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";

import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomTextArea from "@/components/inputs/CustomTextArea";

import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";
import { MediaSection } from "./MediaSection";
import { uploadMedia } from "@/lib/functions/uploadMedia";

import styles from "./ArticleForm.module.css";

interface ArticleFormProps {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    artist?: string;
    content: string;
    media: {
      id: string;
      url: string;
      kind: MediaKind;
    }[];
  };
}

interface FormDataType {
  title: string;
  artist?: string;
  content: string;
}

export default function ArticleForm({ mode, article }: ArticleFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);

  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>(
    article?.media.map((m, i) => ({
      ...m,
      position: i,
    })) || []
  );

  const [addedMedia, setAddedMedia] = useState<NewMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormDataType>({
    defaultValues: {
      title: article?.title ?? "",
      artist: article?.artist ?? "",
      content: article?.content ?? "",
    },
  });

  if (!user) return <p>Tenés que estar logueado</p>;

  /* =======================
     ADD FILES (UPLOAD YA)
     ======================= */

  const addFiles = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      const kind: MediaKind = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio";

      const tempUrl = URL.createObjectURL(file);

      // aparece inmediatamente
      setAddedMedia((prev) => [
        ...prev,
        {
          file,
          url: tempUrl,
          kind,
          status: "uploading",
        },
      ]);

      try {
        const uploadedUrl = await uploadMedia(file);

        setAddedMedia((prev) =>
          prev.map((m) =>
            m.url === tempUrl
              ? { ...m, url: uploadedUrl, status: "ready" }
              : m
          )
        );

        URL.revokeObjectURL(tempUrl);
      } catch {
        setAddedMedia((prev) =>
          prev.map((m) =>
            m.url === tempUrl ? { ...m, status: "error" } : m
          )
        );
      }
    }
  };

  /* =======================
     REMOVE
     ======================= */

  const removeExisting = (id: string) => {
    setExistingMedia((p) => p.filter((m) => m.id !== id));
    setRemovedMediaIds((p) => [...p, id]);
  };

  const removeAdded = (index: number) => {
    setAddedMedia((p) => p.filter((_, i) => i !== index));
  };

  /* =======================
     SUBMIT (CREA / EDITA)
     ======================= */

  const onSubmit = async (data: FormDataType) => {
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("artist", data.artist || "");
      formData.append("content", data.content);

      if (mode === "create") {
        formData.append("author_uid", user.uid);
      }

      removedMediaIds.forEach((id) =>
        formData.append("removed_media_ids[]", id)
      );

      existingMedia.forEach((m) =>
        formData.append(
          "media_positions[]",
          JSON.stringify({ id: m.id, position: m.position })
        )
      );

      addedMedia
        .filter((m) => m.status === "ready")
        .forEach((m, index) =>
          formData.append(
            "new_media[]",
            JSON.stringify({
              url: m.url,
              kind: m.kind,
              position: index,
            })
          )
        );

      const res = await fetch(
        mode === "create"
          ? "/api/articles"
          : `/api/articles/${article!.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Error guardando artículo");

      router.push(
        mode === "create"
          ? "/articles"
          : `/articles/${article!.id}`
      );
    } catch (e) {
      console.error(e);
      alert("Error");
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     RENDER
     ======================= */

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["article-form"]}
    >
      <CustomTextInput
        name="title"
        label="Title"
        register={register}
        error={errors.title}
      />

      <CustomTextInput
        name="artist"
        label="Artist"
        register={register}
        error={errors.artist}
      />

      <CustomTextArea
        name="content"
        label="Content"
        control={control}
      />

      <MediaSection
        title="Images"
        kind="image"
        existing={existingMedia}
        setExisting={setExistingMedia}
        removeExisting={removeExisting}
        added={addedMedia}
        removeAdded={removeAdded}
        addFiles={addFiles}
      />

      <MediaSection
        title="Videos"
        kind="video"
        existing={existingMedia}
        setExisting={setExistingMedia}
        removeExisting={removeExisting}
        added={addedMedia}
        removeAdded={removeAdded}
        addFiles={addFiles}
      />

      <MediaSection
        title="Audios"
        kind="audio"
        existing={existingMedia}
        setExisting={setExistingMedia}
        removeExisting={removeExisting}
        added={addedMedia}
        removeAdded={removeAdded}
        addFiles={addFiles}
      />

      <button
        type="submit"
        disabled={
          saving ||
          addedMedia.some((m) => m.status === "uploading")
        }
        className={styles["article-form-submit-button"]}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
