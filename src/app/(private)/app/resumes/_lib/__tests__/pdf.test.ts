import { buildResumePdfHtml, createResumePdfFileName } from "@/app/(private)/app/resumes/_lib/pdf";

describe("resume pdf", () => {
  it("PDF HTML 생성 시 사용자 입력 문자열을 이스케이프해야 한다", () => {
    const html = buildResumePdfHtml({
      resume: {
        title: "<script>alert('x')</script>",
        targetCompany: "ACME",
        targetRole: "Frontend",
        level: "senior",
        summaryMd: "요약",
        updatedAt: "2026-02-09T00:00:00.000Z",
      },
      items: [
        {
          itemId: "item-1",
          sortOrder: 10,
          notes: "<b>메모</b>",
          resolvedBulletsJson: ["A", "B"],
          resolvedMetricsJson: { growth: "20%" },
          resolvedTechTags: ["TypeScript"],
          experience: {
            company: "회사",
            role: "개발자",
            summary: "설명",
          },
        },
      ],
    });

    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;메모&lt;/b&gt;");
    expect(html).not.toContain("<script>alert('x')</script>");
  });

  it("PDF 파일명은 안전한 slug 형태여야 한다", () => {
    expect(createResumePdfFileName("백엔드 이력서 v2")).toBe("resume-v2.pdf");
    expect(createResumePdfFileName("")).toBe("resume.pdf");
  });
});
