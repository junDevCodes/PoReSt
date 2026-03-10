import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth-guard";
import { writeStructuredLog } from "@/lib/observability";

const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const authResult = await requireOwner();
  if ("response" in authResult) {
    return authResult.response;
  }

  const userId = authResult.session.user.id;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    writeStructuredLog("error", "resume.upload.storage_missing", { userId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "스토리지 설정이 누락되었습니다." } },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    writeStructuredLog("warn", "resume.upload.no_file", { userId });
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "파일이 필요합니다." } },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    writeStructuredLog("warn", "resume.upload.invalid_mime", { userId, mimeType: file.type });
    return NextResponse.json(
      { error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "PDF 형식만 업로드할 수 있습니다." } },
      { status: 415 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    writeStructuredLog("warn", "resume.upload.file_too_large", { userId, size: file.size });
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "파일 크기는 10MB를 초과할 수 없습니다." } },
      { status: 413 },
    );
  }

  try {
    const blob = await put(`resumes/${userId}/${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await prisma.portfolioSettings.update({
      where: { ownerId: userId },
      data: { resumeUrl: blob.url },
    });

    return NextResponse.json({ data: { url: blob.url } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    writeStructuredLog("error", "resume.upload.blob_failed", { userId, errorMessage });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요." } },
      { status: 500 },
    );
  }
}
