import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import cloudinary from "@/lib/cloudinary/cloudinary";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  const { id: idParam } = await params; // ✅ await params
  const id = Number(idParam);

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: "Valid Article ID is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("article")
    .select(
      `
      id,
      title,
      artist,
      content,
      author_uid,
      created_at,
      article_media (
        position,
        media (
          id,
          url,
          kind,
          width,
          height,
          duration
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Format the response similar to GET all articles
  const sorted = (data.article_media || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((am: any) => am.media)
    .filter(Boolean);

  const article = {
    ...data,
    images: sorted
      .filter((m: any) => m.kind === "image")
      .map((m: any) => m.url),
    videos: sorted
      .filter((m: any) => m.kind === "video")
      .map((m: any) => m.url),
    audios: sorted
      .filter((m: any) => m.kind === "audio")
      .map((m: any) => m.url),
    media: sorted,
  };

  return NextResponse.json(article);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const articleId = Number(idParam);

    if (!articleId || isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid article id" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    /* 1️⃣ Update article */
    const { error: articleError } = await supabase
      .from("article")
      .update({
        title: formData.get("title"),
        artist: formData.get("artist"),
        content: formData.get("content"),
      })
      .eq("id", articleId);

    if (articleError) throw articleError;

    /* 2️⃣ Remove media */
    const removed = formData.getAll("removed_media_ids[]") as string[];

    if (removed.length > 0) {
      const { error: removeError } = await supabase
        .from("article_media")
        .delete()
        .eq("article_id", articleId)
        .in("media_id", removed);

      if (removeError) throw removeError;
    }

    /* 3️⃣ Update positions */
    const positionsRaw = formData.getAll("media_positions[]") as string[];

    for (const item of positionsRaw) {
      const { id: mediaId, position } = JSON.parse(item);

      const { error: posError } = await supabase
        .from("article_media")
        .update({ position })
        .eq("article_id", articleId)
        .eq("media_id", mediaId);

      if (posError) throw posError;
    }

    /* 4️⃣ Upload NEW media (CLAVE 🔥) */
    const files = formData.getAll("media") as File[];

    const audioExts = ["mp3", "wav", "ogg", "m4a"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());

      const ext = file.name.split(".").pop()?.toLowerCase();
      const isAudio = ext && audioExts.includes(ext);

      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "articles" },
          (err, res) => (err ? reject(err) : resolve(res))
        ).end(buffer);
      });

      const kind: "image" | "video" | "audio" = isAudio
        ? "audio"
        : upload.resource_type === "image"
        ? "image"
        : "video";

      const { data: media, error: mediaError } = await supabase
        .from("media")
        .insert({
          kind,
          url: upload.secure_url,
          provider: "cloudinary",
          public_id: upload.public_id,
          width: upload.width ?? null,
          height: upload.height ?? null,
          duration: upload.duration ?? null,
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      /* posición al final */
      await supabase.from("article_media").insert({
        article_id: articleId,
        media_id: media.id,
        position: positionsRaw.length + i,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ UPDATE ARTICLE ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

