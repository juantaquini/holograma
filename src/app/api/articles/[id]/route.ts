import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";

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

export async function PUT(req: Request, { params }: any) {
  const id = params.id;
  const formData = await req.formData();

  const removed = formData.getAll("removed_media_ids[]");

  // 1. update article fields
  await supabase
    .from("article")
    .update({
      title: formData.get("title"),
      artist: formData.get("artist"),
      content: formData.get("content"),
    })
    .eq("id", id);

  // 2. remove media relations
  if (removed.length) {
    await supabase.from("article_media").delete().in("media_id", removed);
  }

  // 3. upload new media (igual a POST)
}
