"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useForm } from "react-hook-form";

import { VscDiffAdded } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";

import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomTextArea from "@/components/inputs/CustomTextArea";

import styles from "./CreateArticle.module.css";

interface FormDataType {
  title: string;
  artist?: string;
  content: string;
}

interface MediaPreview {
  file: File;
  url: string;
}

export default function CreateArticleForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<MediaPreview[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormDataType>();

  if (!user) {
    return <p>Tenés que estar logueado</p>;
  }

  /* -------------------------
     MEDIA HANDLERS
  ------------------------- */

  const handleFilesAdd = (files: FileList | null) => {
    if (!files) return;

    const newItems = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setMedia((prev) => [...prev, ...newItems]);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
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
      formData.append("author_uid", user.uid);

      media.forEach(({ file }) => {
        formData.append("media", file);
      });

      const res = await fetch("/api/articles", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error creando artículo");

      router.push("/articles");
    } catch (err) {
      console.error(err);
      alert("Error creando artículo");
    } finally {
      setUploading(false);
    }
  };

  /* -------------------------
     RENDER
  ------------------------- */

  return (
    <div className={styles["article-create-container"]}>
      <h2 className={styles["article-create-title"]}>Create Article</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["article-create-form"]}
      >
        {/* TITLE + ARTIST */}
        <div className={styles["article-create-input-pair"]}>
          <div className={styles["article-form-group"]}>
            <CustomTextInput
              name="title"
              label="Title"
              placeholder="Article title"
              register={register}
              error={errors.title}
            />
          </div>

          <div className={styles["article-form-group"]}>
            <CustomTextInput
              name="artist"
              label="Artist"
              placeholder="Artist (optional)"
              register={register}
              error={errors.artist}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles["article-form-group"]}>
          <CustomTextArea
            name="content"
            label="Content"
            placeholder="Write the article content…"
            control={control}
          />
        </div>

        {/* MEDIA */}
        <div className={styles["article-form-group"]}>
          <label className={styles["article-form-label"]}>Media</label>

          <div className={styles["article-media-preview"]}>
            {media.map((item, index) => {
              const type = item.file.type;

              return (
                <div
                  key={index}
                  className={styles["article-media-preview-container"]}
                >
                  {type.startsWith("image") && (
                    <img
                      src={item.url}
                      className={styles["article-media-preview-item"]}
                    />
                  )}

                  {type.startsWith("video") && (
                    <video
                      src={item.url}
                      controls
                      className={styles["article-media-preview-item"]}
                    />
                  )}

                  {type.startsWith("audio") && (
                    <audio
                      src={item.url}
                      controls
                      className={styles["article-media-preview-item"]}
                    />
                  )}

                  <button
                    type="button"
                    className={styles["article-media-remove-button"]}
                    onClick={() => removeMedia(index)}
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              );
            })}

            {/* UPLOAD */}
            <div className={styles["article-media-upload-container"]}>
              <label
                htmlFor="media-upload"
                className={styles["article-media-upload-label"]}
              >
                <div className={styles["article-media-upload-icon"]}>
                  <VscDiffAdded />
                </div>
                <span className={styles["article-media-upload-text"]}>
                  Add media
                </span>
                <input
                  id="media-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => handleFilesAdd(e.target.files)}
                  className={styles["hidden-input"]}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className={styles["article-form-actions"]}>
          <button
            type="button"
            onClick={() => router.push("/articles")}
            className={styles["article-form-cancel-button"]}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={uploading}
            className={styles["article-form-submit-button"]}
          >
            {uploading ? "Creating..." : "Create Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
