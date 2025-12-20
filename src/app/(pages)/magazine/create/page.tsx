"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { post, get } from "@/api/http";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useForm } from "react-hook-form";
import { VscDiffAdded } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import CustomDropdown from "@/components/inputs/CustomDropdown";
import CustomTextArea from "@/components/inputs/CustomTextArea";
import styles from "./CreateArticle.module.css";

interface FormDataType {
  title: string;
  content: string;
  type: string;
}

interface UserData {
  role: string;
}

interface AudioPreview {
  url: string;
  name: string;
  loaded: boolean;
}

interface VideoPreview {
  url: string;
  name: string;
  loaded: boolean;
}

const CreateArticle = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAudioFiles, setSelectedAudioFiles] = useState<File[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);
  const [audioPreviews, setAudioPreviews] = useState<AudioPreview[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreview[]>([]);

  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormDataType>();

  const typeOptions = [
    { label: "Text", value: "text" },
    { label: "Photo", value: "photo" },
    { label: "Video", value: "video" },
    { label: "Music", value: "music" },
  ];

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.uid) {
        try {
          const userData = await get<UserData>(`/users/${user.uid}`);
          setIsAdmin(userData.role === "admin");
          if (userData.role !== "admin") {
            router.push("/magazine");
          }
        } catch (error) {
          console.error("Error al verificar el rol del usuario:", error);
          setIsAdmin(false);
          router.push("/magazine");
        }
      } else {
        router.push("/magazine");
      }
    };

    checkUserRole();
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePreview = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.some((file) => !file.type.startsWith("image/"))) {
      alert("Por favor, solo arrastre archivos de imagen");
      return;
    }
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedAudioFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      loaded: false,
    }));
    setAudioPreviews((prev) => [...prev, ...newPreviews]);
  };

  const markAudioLoaded = (index: number) => {
    setAudioPreviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, loaded: true } : p))
    );
  };

  const handleRemoveAudio = (index: number) => {
    setAudioPreviews((prev) => {
      const toRemove = prev[index];
      if (toRemove?.url) URL.revokeObjectURL(toRemove.url);
      return prev.filter((_, i) => i !== index);
    });
    setSelectedAudioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedVideoFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      loaded: false,
    }));
    setVideoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const markVideoLoaded = (index: number) => {
    setVideoPreviews((prev) =>
      prev.map((p, i) => (i === index ? { ...p, loaded: true } : p))
    );
  };

  const handleRemoveVideo = (index: number) => {
    setVideoPreviews((prev) => {
      const toRemove = prev[index];
      if (toRemove?.url) URL.revokeObjectURL(toRemove.url);
      return prev.filter((_, i) => i !== index);
    });
    setSelectedVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormDataType) => {
    setUploading(true);
    try {
      // Crear FormData correctamente
      const formData = new FormData();
      
      // Agregar campos de texto
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("type", data.type);
      formData.append("author_uid", user?.uid || "");

      // Agregar imágenes
      selectedFiles.forEach((file) => {
        formData.append("image", file, file.name); // ← Agregar nombre del archivo
      });

      // Agregar audios
      selectedAudioFiles.forEach((file) => {
        formData.append("audio", file, file.name); // ← Agregar nombre del archivo
      });

      // Agregar videos
      selectedVideoFiles.forEach((file) => {
        formData.append("video", file, file.name); // ← Agregar nombre del archivo
      });

      // Debug: Ver qué hay en FormData
      console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await post("/articles/create_article", formData);
      
      console.log("Response:", response);

      router.push("/magazine");
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Error al crear el artículo. Por favor, intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles["article-create-container"]}>
      <h2 className={styles["article-create-title"]}>Create Article</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["article-create-form"]}
      >
        <div className={styles["article-create-input-pair"]}>
          <div className={styles["article-form-group"]}>
            <CustomTextInput
              name="title"
              register={register}
              label="Title"
              placeholder="Article Title"
              error={errors.title}
            />
          </div>
          <div className={styles["article-form-group"]}>
            <CustomDropdown
              name="type"
              control={control}
              options={typeOptions}
              label="Type"
              rules={{ required: "Type is required" }}
            />
          </div>
        </div>
        <div className={styles["article-pair-form-group"]}>
          <div className={styles["article-form-group"]}>
            <CustomTextArea
              name="content"
              control={control}
              label="Article Content"
              placeholder="Article Text Content"
            />
          </div>
          <div className={styles["article-form-group"]}>
            <label className={styles["article-form-label"]}>Videos</label>
            <div className={styles["article-media-preview"]}>
              {videoPreviews.map((video, index) => (
                <div
                  key={index}
                  className={styles["article-media-preview-container"]}
                >
                  <video
                    className={styles["article-media-preview-item"]}
                    controls
                    src={video.url}
                    onCanPlayThrough={() => markVideoLoaded(index)}
                  />
                  <button
                    type="button"
                    className={styles["article-media-remove-button"]}
                    onClick={() => handleRemoveVideo(index)}
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
              <div className={styles["article-media-upload-container"]}>
                <label
                  htmlFor="video-upload"
                  className={styles["article-media-upload-label"]}
                >
                  <div className={styles["article-media-upload-icon"]}>
                    <VscDiffAdded />
                  </div>
                  <span className={styles["article-media-upload-text"]}>
                    Add Videos
                  </span>
                  <input
                    id="video-upload"
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className={styles["hidden-input"]}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className={styles["article-pair-form-group"]}>
          <div className={styles["article-form-group"]}>
            <label className={styles["article-form-label"]}>Images</label>
            <div className={styles["article-media-preview"]}>
              {previewImages.map((preview, index) => (
                <div
                  key={index}
                  className={styles["article-media-preview-container"]}
                >
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className={styles["article-media-preview-item"]}
                  />
                  <button
                    type="button"
                    className={styles["article-media-remove-button"]}
                    onClick={() => handleRemovePreview(index)}
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
              <div
                className={styles["article-media-upload-container"]}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <label
                  htmlFor="image-upload"
                  className={styles["article-media-upload-label"]}
                >
                  <div className={styles["article-media-upload-icon"]}>
                    <VscDiffAdded />
                  </div>
                  <span className={styles["article-media-upload-text"]}>
                    Add Images
                  </span>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*"
                    className={styles["hidden-input"]}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className={styles["article-form-group"]}>
            <label className={styles["article-form-label"]}>Audios</label>
            <div className={styles["article-media-preview"]}>
              {audioPreviews.map((audio, index) => (
                <div
                  key={index}
                  className={styles["article-media-preview-container"]}
                >
                  <audio
                    className={styles["article-media-preview-item"]}
                    controls
                    src={audio.url}
                    onCanPlayThrough={() => markAudioLoaded(index)}
                  />
                  <button
                    type="button"
                    className={styles["article-media-remove-button"]}
                    onClick={() => handleRemoveAudio(index)}
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
              <div className={styles["article-media-upload-container"]}>
                <label
                  htmlFor="audio-upload"
                  className={styles["article-media-upload-label"]}
                >
                  <div className={styles["article-media-upload-icon"]}>
                    <VscDiffAdded />
                  </div>
                  <span className={styles["article-media-upload-text"]}>
                    Add Audios
                  </span>
                  <input
                    id="audio-upload"
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className={styles["hidden-input"]}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className={styles["article-form-actions"]}>
          <button
            type="button"
            onClick={() => router.push("/magazine")}
            className={styles["custom-red-button-class"]}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles["custom-button-class"]}
            disabled={uploading}
          >
            {uploading ? "Creating..." : "Create Article"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArticle;