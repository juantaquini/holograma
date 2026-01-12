// POST /api/media
export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.url; // 👈 URL FINAL (S3 / Cloudinary / etc)
}
