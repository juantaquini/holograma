"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useArticles } from "@/hooks/useArticles";
import { post, get } from "@/api/http";
import { useAuth } from "@/app/(providers)/auth-provider";
import { useForm } from "react-hook-form";
import { VscDiffAdded } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaPause, FaPlay } from "react-icons/fa6";
import WaveSurfer from "wavesurfer.js";
import CustomTextInput from "@/components/inputs/CustomTextInput";
import LoadingSketch from "@/components/p5/loading/LoadingSketch";
import ImageCarousel from "../components/ImageCarousel";
import DynamicPad from "../components/DynamicPad";
import styles from "./ArticleDetail.module.css";

interface UserData {
  role: string;
}

interface IArticle {
  id: string;
  title: string;
  artist: string;
  content: string;
  image?: string[];
  audio?: string[];
  video?: string[];
}

interface FormDataType {
  title: string;
  artist: string;
  content: string;
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

interface WavesurferPreviewProps {
  src: string;
}

const WavesurferPreview = ({ src }: WavesurferPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (wsRef.current) {
      try {
        wsRef.current.destroy();
      } catch {}
      wsRef.current = null;
    }

    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      height: 64,
      waveColor: "#9aa0a6",
      progressColor: "#1a73e8",
      cursorColor: "transparent",
      cursorWidth: 1,
      barWidth: 2,
      normalize: true,
    });

    wsRef.current.load(src);

    wsRef.current.on("ready", () => setIsReady(true));
    wsRef.current.on("finish", () => setIsPlaying(false));
    wsRef.current.on("error", () => {});

    return () => {
      try {
        if (wsRef.current) {
          try { wsRef.current.unAll(); } catch {}
          try { wsRef.current.pause(); } catch {}
          if (isReady) {
            try { wsRef.current.destroy(); } catch {}
          }
        }
      } catch {}
      wsRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!isReady || !wsRef.current) return;
    wsRef.current.playPause();
    setIsPlaying(wsRef.current.isPlaying());
  };

  return (
    <div className={styles["article-detail-media-content"]} style={{ width: "100%" }}>
      <div ref={containerRef} style={{ width: "100%" }} />
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button type="button" onClick={togglePlay} disabled={!isReady}>
          {isPlaying ? <FaPause /> : isReady ? <FaPlay /> : "Cargando..."}
        </button>
      </div>
    </div>
  );
};

interface ArticleDetailProps {
  params: Promise<{
    id: string;
  }>;
}

const ArticleDetail = ({ params }: ArticleDetailProps) => {
  const { id } = use(params);
  const router = useRouter();
  const {
    data: articlesData,
    isLoading,
    refetch: articleRefetch,
  } = useArticles();
  const article: IArticle | undefined = (articlesData as IArticle[] | undefined)?.find((a) => a.id.toString() === id);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [orderedImages, setOrderedImages] = useState<string[]>([]);
  const [selectedAudioFiles, setSelectedAudioFiles] = useState<File[]>([]);
  const [audioPreviews, setAudioPreviews] = useState<AudioPreview[]>([]);
  const [audiosToDelete, setAudiosToDelete] = useState<string[]>([]);
  const [displayedAudios, setDisplayedAudios] = useState<string[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreview[]>([]);
  const [videosToDelete, setVideosToDelete] = useState<string[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormDataType>();

  useEffect(() => {
    if (article) {
      setValue("title", article.title ?? "");
      setValue("artist", article.artist ?? "");
      setValue("content", article.content ?? "");

      if (article.image && Array.isArray(article.image)) {
        setOrderedImages(article.image);
      }
      if (article.audio && Array.isArray(article.audio)) {
        setDisplayedAudios([...article.audio]);
      } else {
        setDisplayedAudios([]);
      }
      if (article.video && Array.isArray(article.video)) {
        setDisplayedVideos([...article.video]);
      } else {
        setDisplayedVideos([]);
      }
    }
  }, [article, setValue]);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.uid) {
        try {
          const userData = await get<UserData>(`/users/${user.uid}`);
          setIsAdmin(userData.role === "admin");
        } catch (error) {
          console.error("Error al verificar el rol del usuario:", error);
          setIsAdmin(false);
        }
      }
    };

    checkUserRole();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewImages((prev) => [...prev, dataUrl]);
        uploadImageFile(file)
          .then(() => {
            setPreviewImages((prev) => {
              const idx = prev.indexOf(dataUrl);
              if (idx === -1) return prev;
              const next = [...prev];
              next.splice(idx, 1);
              setSelectedFiles((prevFiles) => {
                const filesNext = [...prevFiles];
                if (idx >= 0) filesNext.splice(idx, 1);
                return filesNext;
              });
              return next;
            });
          })
          .catch((err) => {
            console.error('Image upload failed:', err);
          });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDiscard = () => {
    setSelectedFiles([]);
    setPreviewImages([]);
    setImagesToDelete([]);
    setSelectedAudioFiles([]);
    setAudioPreviews([]);
    setAudiosToDelete([]);
    setSelectedVideoFiles([]);
    setVideoPreviews([]);
    setVideosToDelete([]);
    setIsEditing(false);
    if (article) {
      setValue("title", article.title ?? "");
      setValue("artist", article.artist ?? "");
      setValue("content", article.content ?? "");
      if (article.image && Array.isArray(article.image)) {
        setOrderedImages(article.image);
      }
    }
  };

  const handleDeleteExistingImage = (index: number) => {
    if (article?.image) {
      const imageToDelete = orderedImages[index];
      setImagesToDelete((prev) => [...prev, imageToDelete]);
      setOrderedImages((prev) => prev.filter((img) => img !== imageToDelete));
    }
  };

  const handleReorderImages = (newOrder: string[]) => {
    setOrderedImages(newOrder);
  };

  const handleDeletePreviewImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReorderPreviewImages = (newOrder: string[]) => {
    setPreviewImages(newOrder);
    setSelectedFiles((prevFiles) => {
      const map: Record<number, number> = {};
      newOrder.forEach((img, newIdx) => {
        const oldIdx = (previewImages as string[]).indexOf(img);
        if (oldIdx !== -1) map[oldIdx] = newIdx;
      });
      const reordered: File[] = [];
      prevFiles.forEach((file, oldIdx) => {
        const newIdx = map[oldIdx];
        if (typeof newIdx === 'number') {
          reordered[newIdx] = file;
        }
      });
      return reordered.filter(Boolean) as File[];
    });
  };

  const uploadImageFile = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const resp = await post(`/articles/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url =
      typeof resp === 'string'
        ? resp
        : (resp?.url || resp?.imageUrl || resp?.path || resp?.data?.url || resp?.data?.imageUrl || resp?.data?.path);
    if (url) {
      setOrderedImages((prev) => [...prev, url]);
    } else {
      try {
        await articleRefetch();
      } catch {}
    }
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

  const handleDeleteExistingAudio = (index: number) => {
    if (article?.audio) {
      const audioToDelete = article.audio[index];
      setAudiosToDelete((prev) => [...prev, audioToDelete]);
      setDisplayedAudios((prev) => prev.filter((_, i) => i !== index));
    }
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

  const handleDeleteExistingVideo = (index: number) => {
    if (article?.video) {
      const videoToDelete = article.video[index];
      setVideosToDelete((prev) => [...prev, videoToDelete]);
      setDisplayedVideos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (files.some((file) => !file.type.startsWith('image/'))) {
        alert('Por favor, solo arrastre archivos de imagen');
        return;
      }
      setSelectedFiles((prevFiles) => [...prevFiles, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreviewImages((prev) => [...prev, dataUrl]);
          uploadImageFile(file)
            .then(() => {
              setPreviewImages((prev) => {
                const idx = prev.indexOf(dataUrl);
                if (idx === -1) return prev;
                const next = [...prev];
                next.splice(idx, 1);
                setSelectedFiles((prevFiles) => {
                  const filesNext = [...prevFiles];
                  if (idx >= 0) filesNext.splice(idx, 1);
                  return filesNext;
                });
                return next;
              });
            })
            .catch((err) => {
              console.error('Image upload failed:', err);
            });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isEditing) return;

    const image = e.currentTarget;
    const rect = image.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    image.style.setProperty("--x", x + "%");
    image.style.setProperty("--y", y + "%");

    image.classList.toggle(styles["zoomed"]);
  };

  const onSubmit = async (data: FormDataType) => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("artist", data.artist);
      formData.append("content", data.content);
      formData.append("imageOrder", JSON.stringify(orderedImages));

      selectedFiles.forEach((file) => {
        formData.append("image", file);
      });

      imagesToDelete.forEach((imageUrl) => {
        formData.append("imagesToDelete", imageUrl);
      });

      selectedAudioFiles.forEach((file) => {
        formData.append("audio", file);
      });

      audiosToDelete.forEach((audioUrl) => {
        formData.append("audiosToDelete", audioUrl);
      });

      selectedVideoFiles.forEach((file) => {
        formData.append("video", file);
      });

      videosToDelete.forEach((videoUrl) => {
        formData.append("videosToDelete", videoUrl);
      });

      await post(`/articles/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFiles([]);
      setPreviewImages([]);
      setImagesToDelete([]);
      setSelectedAudioFiles([]);
      setAudioPreviews([]);
      setAudiosToDelete([]);
      setSelectedVideoFiles([]);
      setVideoPreviews([]);
      setVideosToDelete([]);
      setIsEditing(false);

      await articleRefetch();
    } catch (error) {
      console.error("Error updating article:", error);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <LoadingSketch />;
  }

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className={styles["article-detail-main-container"]}>
      {/* NUEVO CAROUSEL COMPONENT */}
      <ImageCarousel
          images={orderedImages}
          previewImages={previewImages}
          isEditing={isEditing}
          isAdmin={isAdmin}
          onReorder={handleReorderImages}
          onDeleteExisting={handleDeleteExistingImage}
          onFileChange={handleFileChange}
          onDrop={handleDrop}
          previewOnReorder={handleReorderPreviewImages}
          onDeletePreview={handleDeletePreviewImage}
        />

      <div className={styles["article-detail-details-container"]}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles["article-detail-content"]}
        >
          <div className={styles["article-detail-content-row"]}>
            <div className={styles["article-detail-info-container"]}>
              {isEditing ? (
                <>
                  <CustomTextInput
                    name="artist"
                    register={register}
                    placeholder="Article Author"
                    error={errors.artist}
                  />
                  <CustomTextInput
                    name="title"
                    register={register}
                    placeholder="Article Title"
                    error={errors.title}
                  />
                  {isAdmin && (
                    <div className={styles["article-detail-actions"]}>
                      <button
                        type="submit"
                        className={styles["custom-button-class"]}
                        disabled={uploading}
                      >
                        {uploading ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscard}
                        className={styles["custom-red-button-class"]}
                      >
                        Discard
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles["article-detail-audio-title-row"]}>
                    <p className={styles["article-detail-title"]}>{article?.artist}</p>
                    <p className={styles["article-detail-artist"]}>{article?.title}</p>
                  </div>
                  {isAdmin && (
                    <div className={styles["article-detail-actions"]}>
                      <button
                        type="submit"
                        className={styles["custom-button-class"]}
                        disabled={uploading}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {isEditing ? (
              <div className={styles["article-detail-media-edit-container"]}>
                <div className={styles["article-detail-form-group"]}>
                  <label className={styles["article-detail-form-label"]}>Article Audios</label>
                  <div className={styles["article-detail-media-preview"]}>
                    {displayedAudios.length > 0 &&
                      displayedAudios.map((audio, index) => (
                        <div
                          key={`existing-audio-${index}`}
                          className={styles["article-detail-media-audio-item"]}
                        >
                          <WavesurferPreview src={audio} />
                          <button
                            type="button"
                            className={styles["delete-media-button"]}
                            onClick={() => handleDeleteExistingAudio(index)}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        </div>
                      ))}
                    {audioPreviews.map((audio, index) => (
                      <div
                        key={`new-audio-${index}`}
                        className={styles["article-detail-media-audio-item"]}
                      >
                        <audio
                          className={styles["article-detail-media-content"]}
                          controls
                          src={audio.url}
                          onCanPlayThrough={() => markAudioLoaded(index)}
                        />
                        <button
                          type="button"
                          className={styles["delete-media-button"]}
                          onClick={() => handleRemoveAudio(index)}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    ))}
                    <div className={styles["article-detail-media-audio-upload-container"]}>
                      <label
                        htmlFor="audio-upload"
                        className={styles["article-detail-media-upload-label"]}
                      >
                        <div className={styles["article-detail-media-upload-icon"]}>
                          <VscDiffAdded />
                        </div>
                        <span className={styles["article-detail-media-upload-text"]}>
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

                <div className={styles["article-detail-form-group"]}>
                  <label className={styles["article-detail-form-label"]}>Article Videos</label>
                  <div className={styles["article-detail-media-preview"]}>
                    {displayedVideos.length > 0 &&
                      displayedVideos.map((video, index) => (
                        <div
                          key={`existing-video-${index}`}
                          className={styles["article-detail-media-item"]}
                        >
                          <video
                            className={styles["article-detail-media-content"]}
                            controls
                            src={video}
                          />
                          <button
                            type="button"
                            className={styles["delete-media-button"]}
                            onClick={() => handleDeleteExistingVideo(index)}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        </div>
                      ))}
                    {videoPreviews.map((video, index) => (
                      <div
                        key={`new-video-${index}`}
                        className={styles["article-detail-media-item"]}
                      >
                        <video
                          className={styles["article-detail-media-content"]}
                          controls
                          src={video.url}
                          onCanPlayThrough={() => markVideoLoaded(index)}
                        />
                        <button
                          type="button"
                          className={styles["delete-media-button"]}
                          onClick={() => handleRemoveVideo(index)}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    ))}
                    <div className={styles["article-detail-media-upload-container"]}>
                      <label
                        htmlFor="video-upload"
                        className={styles["article-detail-media-upload-label"]}
                      >
                        <div className={styles["article-detail-media-upload-icon"]}>
                          <VscDiffAdded />
                        </div>
                        <span className={styles["article-detail-media-upload-text"]}>
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
            ) : (
              <div className={styles["audio-playlist-player"]}>
                {/* Aquí irá tu componente AudioPlaylistPlayer */}
              </div>
            )}
          </div>
        </form>
        <div className={styles["article-detail-content-container"]}>
          <div className={styles["article-text-container"]}>
            {article?.video?.[0] && (
              <video
                src={article.video[0]}
                autoPlay
                loop
                muted
                playsInline
                className={styles["inline-video"]}
              />
            )}
            <span>{article?.content}</span>
          </div>
        </div>
        {/* Solo renderizar DynamicPad si hay audios disponibles */}
        {(article?.audio?.length ?? 0) > 0 && (
          <div className={styles["dynamic-pad"]}>
            <DynamicPad />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;