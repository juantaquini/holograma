import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-server";
import cloudinary from "@/lib/cloudinary/cloudinary";

export const runtime = "nodejs";

type ArticleMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | "audio";
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

type Article = {
  id: string;
  title: string;
  artist?: string;
  content: string;
  author_uid: string;
  created_at: string;
  images: string[];
  videos: string[];
  audios: string[];
  media: ArticleMedia[];
};

// --------------------
// GET ARTICLES
// --------------------
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("article")
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const articles: Article[] = (data || []).map((article: any) => {
      const sorted = (article.article_media || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((am: any) => am.media)
        .filter(Boolean);

      return {
        ...article,
        images: sorted.filter((m: any) => m.kind === "image").map((m: any) => m.url),
        videos: sorted.filter((m: any) => m.kind === "video").map((m: any) => m.url),
        audios: sorted.filter((m: any) => m.kind === "audio").map((m: any) => m.url),
        media: sorted,
      };
    });

    return NextResponse.json(articles, { status: 200 });
  } catch (err: any) {
    console.error("❌ GET ARTICLES ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// --------------------
// POST ARTICLE
// --------------------
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const content = formData.get("content") as string;
    const author_uid = formData.get("author_uid") as string;
    const files = formData.getAll("media") as File[];

    if (!title || !author_uid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1️⃣ Crear artículo
    const { data: article, error: articleError } = await supabase
      .from("article")
      .insert({ title, artist, content, author_uid })
      .select()
      .single();

    if (articleError) throw articleError;

    // 2️⃣ Subir media
    const audioExts = ["mp3", "wav", "ogg", "m4a"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());

      // Detectar si es audio
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isAudio = audioExts.includes(ext!);

      // Subir siempre con resource_type "auto" para evitar error TS
      const upload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: "auto", folder: "articles" },
            (err, res) => (err ? reject(err) : resolve(res))
          )
          .end(buffer);
      });

      // Guardar en DB con kind correcto
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

      // Relacionar con article_media
      await supabase.from("article_media").insert({
        article_id: article.id,
        media_id: media.id,
        position: i,
      });
    }

    return NextResponse.json({ success: true, article_id: article.id });
  } catch (err: any) {
    console.error("CREATE ARTICLE ERROR:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
