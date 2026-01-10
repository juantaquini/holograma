"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/(providers)/auth-provider";

import { RiDeleteBin6Line } from "react-icons/ri";
import { VscDiffAdded } from "react-icons/vsc";

import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomTextArea from "@/components/inputs/CustomTextArea";

import styles from "./ArticleForm.module.css";

type MediaKind = "image" | "video" | "audio";

type ArticleMedia = {
  id: string;
  url: string;
  kind: MediaKind;
};

type NewMedia = {
  file: File;
  url: string;
  kind: MediaKind;
};

interface ArticleFormProps {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    artist?: string;
    content: string;
    media: ArticleMedia[];
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

  const [existingMedia, setExistingMedia] = useState<ArticleMedia[]>(
    article?.media || []
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

  /* -------------------------
     MEDIA
  ------------------------- */

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const items = Array.from(files).map((file) => {
      let kind: MediaKind =
        file.type.startsWith("image")
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

  /* -------------------------
     SUBMIT
  ------------------------- */

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

  /* -------------------------
     RENDER
  ------------------------- */

  return (
    <div className={styles["article-create-container"]}>
      <h2 className={styles["article-create-title"]}>
        {mode === "create" ? "Create Article" : "Edit Article"}
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["article-create-form"]}
      >
        {/* TITLE + ARTIST */}
        <div className={styles["article-create-input-pair"]}>
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
        </div>

        {/* CONTENT */}
        <CustomTextArea name="content" label="Content" control={control} />

        {/* MEDIA */}
        <div className={styles["article-media-preview"]}>
          {existingMedia.map((m) => (
            <div key={m.id}>
              {m.kind === "image" && <img src={m.url} />}
              {m.kind === "video" && <video src={m.url} controls />}
              {m.kind === "audio" && <audio src={m.url} controls />}
              <button onClick={() => removeExisting(m.id)}>
                <RiDeleteBin6Line />
              </button>
            </div>
          ))}

          {addedMedia.map((m, i) => (
            <div key={i}>
              {m.kind === "image" && <img src={m.url} />}
              {m.kind === "video" && <video src={m.url} controls />}
              {m.kind === "audio" && <audio src={m.url} controls />}
              <button onClick={() => removeAdded(i)}>
                <RiDeleteBin6Line />
              </button>
            </div>
          ))}

          <label>
            <VscDiffAdded /> Add media
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={(e) => addFiles(e.target.files)}
              hidden
            />
          </label>
        </div>

        <button type="submit" disabled={uploading}>
          {uploading
            ? "Saving..."
            : mode === "create"
            ? "Create"
            : "Save changes"}
        </button>
      </form>
    </div>
  );
}
