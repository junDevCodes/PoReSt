import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("response" in authResult) {
    return authResult.response;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "스토리지 설정이 누락되었습니다." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "JPEG, PNG, WebP, GIF 형식만 업로드할 수 있습니다." },
      { status: 415 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 5MB를 초과할 수 없습니다." }, { status: 413 });
  }

  try {
    const blob = await put(`avatars/${authResult.session.user.id}/${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ data: { url: blob.url } });
  } catch (error) {
    console.error("[avatar-upload] blob put failed:", error);
    return NextResponse.json({ error: "파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
