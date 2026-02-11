import { createBlogExportArtifact } from "@/modules/blog/export";

describe("blog export", () => {
  it("html 형식으로 내보내면 html 문서와 파일명이 생성되어야 한다", () => {
    const artifact = createBlogExportArtifact({
      title: "React 성능 최적화",
      contentMd: "# 제목\n\n본문 내용",
      format: "html",
    });

    expect(artifact.contentType).toBe("text/html; charset=utf-8");
    expect(artifact.fileName.endsWith(".html")).toBe(true);
    expect(artifact.buffer.toString("utf8")).toContain("<!doctype html>");
  });

  it("md 형식으로 내보내면 원문 markdown과 파일명이 생성되어야 한다", () => {
    const markdown = "# 제목\n\n본문 내용";
    const artifact = createBlogExportArtifact({
      title: "Blog Draft",
      contentMd: markdown,
      format: "md",
    });

    expect(artifact.contentType).toBe("text/markdown; charset=utf-8");
    expect(artifact.fileName.endsWith(".md")).toBe(true);
    expect(artifact.buffer.toString("utf8")).toBe(markdown);
  });

  it("zip 형식으로 내보내면 zip 시그니처를 가진 버퍼가 생성되어야 한다", () => {
    const artifact = createBlogExportArtifact({
      title: "Zip Export",
      contentMd: "본문",
      format: "zip",
    });

    expect(artifact.contentType).toBe("application/zip");
    expect(artifact.fileName.endsWith(".zip")).toBe(true);
    expect(artifact.buffer[0]).toBe(0x50);
    expect(artifact.buffer[1]).toBe(0x4b);
  });
});
