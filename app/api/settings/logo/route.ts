import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be under 2 MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${auth.user.id}/logo.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("logos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("logos").getPublicUrl(path);

  // Bust CDN cache by appending a timestamp query param
  const logoUrl = `${publicUrl}?t=${Date.now()}`;

  // Persist the URL to the profile row
  await admin
    .from("profiles")
    .upsert({ id: auth.user.id, logo_url: logoUrl, updated_at: new Date().toISOString() });

  return NextResponse.json({ logo_url: logoUrl });
}
