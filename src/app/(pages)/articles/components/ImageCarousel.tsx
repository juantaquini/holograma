"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { VscDiffAdded } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDragIndicator } from "react-icons/md";
import ScrollSlider from "@/components/layout/ScrollSlider";
import styles from "../[id]/ArticleDetail.module.css";

interface SortableImageProps {
  image: string;
  index: number;
  isEditing: boolean;
  onDelete: (index: number) => void;
  sortableId: string;
}

const SortableImage: React.FC<SortableImageProps> = ({
  image,
  index,
  isEditing,
  onDelete,
  sortableId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles["article-detail-media-item-image-carousel"]}
    >
      {isEditing && (
        <>
          <div
            className={styles["drag-handle"]}
            style={{ touchAction: "none", cursor: "grab" }}
            {...attributes}
            {...listeners}
          >
            <MdDragIndicator />
          </div>
          <button
            className={styles["delete-image-button"]}
            onClick={() => onDelete(index)}
            type="button"
          >
            <RiDeleteBin6Line />
          </button>
        </>
      )}
      <div className={styles["article-detail-media-content"]}>
        <Image
          src={image}
          alt={`Media ${index}`}
          width={1200}
          height={800}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
          priority={index === 0}
        />
      </div>
    </div>
  );
};

interface ImageCarouselProps {
  images: string[];
  previewImages: string[];
  isEditing: boolean;
  isAdmin: boolean;
  onReorder: (newOrder: string[]) => void;
  onDeleteExisting: (index: number) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  previewOnReorder: (newOrder: string[]) => void;
  onDeletePreview: (index: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  previewImages,
  isEditing,
  isAdmin,
  onReorder,
  onDeleteExisting,
  onFileChange,
  onDrop,
  previewOnReorder,
  onDeletePreview,
}) => {
  const [dragOverUpload, setDragOverUpload] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const combo = [
      ...images.map((_, idx) => `img:${idx}`),
      ...previewImages.map((_, idx) => `prev:${idx}`),
    ];

    const from = combo.indexOf(activeId);
    const to = combo.indexOf(overId);
    if (from === -1 || to === -1) return;

    const newCombo = [...combo];
    newCombo.splice(from, 1);
    newCombo.splice(to, 0, activeId);

    const newImages = newCombo
      .filter((id) => id.startsWith("img:"))
      .map((id) => images[Number(id.split(":")[1])]);

    const newPreviews = newCombo
      .filter((id) => id.startsWith("prev:"))
      .map((id) => previewImages[Number(id.split(":")[1])]);

    onReorder(newImages);
    previewOnReorder(newPreviews);
  };

  const handleDeleteExisting = (index: number) => {
    onDeleteExisting(index);
  };

  return (
    <div className={styles["article-detail-media-container"]}>
      {isEditing ? (
        // Modo edición: usa DnD Kit con ScrollSlider
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <ScrollSlider direction="horizontal" disableDrag={true} disableWheel={false}>
            <div className={styles["article-detail-media-preview-image-carousel"]} style={{ flexWrap: "nowrap" }}>
              <SortableContext
                items={[
                  ...images.map((_, idx) => `img:${idx}`),
                  ...previewImages.map((_, idx) => `prev:${idx}`),
                ]}
                strategy={rectSortingStrategy}
              >
                {[
                  ...images.map((_, idx) => ({ kind: "img", idx })),
                  ...previewImages.map((_, idx) => ({ kind: "prev", idx })),
                ].map(({ kind, idx }) => (
                  kind === "img" ? (
                    <SortableImage
                      key={`img:${idx}`}
                      image={images[idx]}
                      index={idx}
                      isEditing={isEditing}
                      onDelete={handleDeleteExisting}
                      sortableId={`img:${idx}`}
                    />
                  ) : (
                    <SortableImage
                      key={`prev:${idx}`}
                      image={previewImages[idx]}
                      index={idx}
                      isEditing={isEditing}
                      onDelete={onDeletePreview}
                      sortableId={`prev:${idx}`}
                    />
                  )
                ))}
              </SortableContext>

              <input
                id="image-upload"
                type="file"
                multiple
                onChange={onFileChange}
                accept="image/*"
                className={styles["hidden-input"]}
              />
            </div>
          </ScrollSlider>
          <button
            type="button"
            className={styles["article-detail-edit-button"]}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            Add images
          </button>
        </DndContext>
      ) : (
        // Modo vista: usa ScrollSlider simple (como en React)
        <ScrollSlider direction="horizontal">
          <>
            {images.map((image, index) => (
              <div
                key={index}
                className={styles["article-detail-image-carrousell"]}
              >
                <div
                  className={styles["article-detail-image-carrousell-photo"]}
                  onClick={undefined}
                  style={{ cursor: "grab" }}
                >
                  <Image
                    src={image}
                    alt={`Slide ${index}`}
                    width={1200}
                    height={800}
                    className={styles["image-content"]}
                    style={{ width: "auto", height: "100%", objectFit: "contain" }}
                    draggable={false}
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}

            {previewImages.map((preview, index) => (
              <div
                className={styles["article-detail-image-carrousell"]}
                key={`preview-${index}`}
              >
                <div className={styles["article-detail-image-carrousell-photo"]}>
                  <Image
                    src={preview}
                    alt={`Preview ${index}`}
                    width={1200}
                    height={800}
                    className={styles["image-content"]}
                    style={{ width: "auto", height: "100%", objectFit: "contain" }}
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </>
        </ScrollSlider>
      )}
    </div>
  );
};

export default ImageCarousel;