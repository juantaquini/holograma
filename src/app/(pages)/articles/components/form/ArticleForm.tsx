"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";

import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomTextArea from "@/components/inputs/CustomTextArea";

import { ExistingMedia, NewMedia, MediaKind } from "@/types/article";
import { MediaSection } from "./MediaSection";

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

  const [uploading, setUploading] = useState(false);

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

  /* MEDIA */

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const items: NewMedia[] = Array.from(files).map((file) => {
      const kind: MediaKind = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "audio";

      return {
        file,
        url: URL.createObjectURL(file),
        kind,
      };
    });

    setAddedMedia((p) => [...p, ...items]);
  };

  const removeExisting = (id: string) => {
    setExistingMedia((p) => p.filter((m) => m.id !== id));
    setRemovedMediaIds((p) => [...p, id]);
  };

  const removeAdded = (index: number) => {
    setAddedMedia((p) => {
      URL.revokeObjectURL(p[index].url);
      return p.filter((_, i) => i !== index);
    });
  };

  /* SUBMIT */

  const onSubmit = async (data: FormDataType) => {
    setUploading(true);

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

      addedMedia.forEach(({ file }) => {
        formData.append("media", file);
      });

      existingMedia.forEach((m) => {
        formData.append("media_positions[]", JSON.stringify({
          id: m.id,
          position: m.position,
        }));
      });

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
        mode === "create" ? "/articles" : `/articles/${article!.id}`
      );
    } catch (err) {
      console.error(err);
      alert("Error");
    } finally {
      setUploading(false);
    }
  };

  /* RENDER */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.articleCreateForm}>
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

      <CustomTextArea name="content" label="Content" control={control} />

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

      <button type="submit" disabled={uploading}>
        {uploading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
