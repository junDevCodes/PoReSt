import { parseBullets, parseMetrics } from "./format-resume-data";

export type ResumePdfPreview = {
  resume: {
    title: string;
    targetCompany: string | null;
    targetRole: string | null;
    level: string | null;
    summaryMd: string | null;
    updatedAt: string;
  };
  items: Array<{
    itemId: string;
    sortOrder: number;
    notes: string | null;
    resolvedBulletsJson: unknown;
    resolvedMetricsJson: unknown;
    resolvedTechTags: string[];
    experience: {
      company: string;
      role: string;
      summary: string | null;
    };
  }>;
};

export type PdfOpenResult = {
  ok: boolean;
  reason?: "POPUP_BLOCKED" | "UNAVAILABLE_WINDOW";
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toISOString().slice(0, 10);
}

function toSafeText(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }
  return escapeHtml(value);
}

export function createResumePdfFileName(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) {
    return "resume.pdf";
  }
  return `resume-${base}.pdf`;
}

function buildBulletsHtml(json: unknown): string {
  const items = parseBullets(json);
  if (items.length === 0) return "";
  const lis = items.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
  return `
    <div class="section-label">주요 성과</div>
    <ul class="bullets">${lis}</ul>
  `;
}

function buildMetricsHtml(json: unknown): string {
  const entries = parseMetrics(json);
  if (entries.length === 0) return "";
  const pills = entries
    .map((m) => `<span class="metric-pill"><strong>${escapeHtml(m.key)}</strong> ${escapeHtml(m.value)}</span>`)
    .join(" ");
  return `
    <div class="section-label">성과 지표</div>
    <div class="metrics">${pills}</div>
  `;
}

function buildTechTagsHtml(tags: string[]): string {
  if (tags.length === 0) return "";
  const pills = tags.map((t) => `<span class="tech-pill">${escapeHtml(t)}</span>`).join(" ");
  return `<div class="tech-tags">${pills}</div>`;
}

export function buildResumePdfHtml(preview: ResumePdfPreview): string {
  const title = toSafeText(preview.resume.title);
  const updatedAt = escapeHtml(formatDateLabel(preview.resume.updatedAt));

  const metaItems: string[] = [];
  if (preview.resume.targetCompany) metaItems.push(escapeHtml(preview.resume.targetCompany));
  if (preview.resume.targetRole) metaItems.push(escapeHtml(preview.resume.targetRole));
  if (preview.resume.level) metaItems.push(escapeHtml(preview.resume.level));
  const metaLine = metaItems.length > 0 ? metaItems.join(" · ") : "";

  const summaryHtml = preview.resume.summaryMd
    ? `<div class="summary-block"><div class="section-label">요약</div><p class="summary-text">${toSafeText(preview.resume.summaryMd)}</p></div>`
    : "";

  const itemsHtml = preview.items
    .map((item, idx) => {
      const summaryP = item.experience.summary
        ? `<p class="exp-summary">${toSafeText(item.experience.summary)}</p>`
        : "";

      return `
        <article class="item">
          <div class="item-header">
            <span class="item-num">${idx + 1}</span>
            <div>
              <h3 class="item-company">${toSafeText(item.experience.company)}</h3>
              <p class="item-role">${toSafeText(item.experience.role)}</p>
            </div>
          </div>
          ${summaryP}
          ${buildTechTagsHtml(item.resolvedTechTags)}
          ${buildBulletsHtml(item.resolvedBulletsJson)}
          ${buildMetricsHtml(item.resolvedMetricsJson)}
        </article>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { color: #1a1a2e; font: 13px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif; }
      main { max-width: 100%; padding: 0; }

      /* 헤더 */
      .header { border-bottom: 2px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 16px; }
      .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
      .header .meta { color: #555; font-size: 12px; margin-top: 4px; }
      .header .date { color: #999; font-size: 11px; margin-top: 2px; }

      /* 요약 */
      .summary-block { margin-bottom: 16px; }
      .summary-text { white-space: pre-wrap; color: #333; font-size: 13px; line-height: 1.7; }

      /* 섹션 라벨 */
      .section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; margin-top: 8px; }

      /* 경력 카드 */
      .items-title { font-size: 14px; font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
      .item { break-inside: avoid; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
      .item-header { display: flex; align-items: flex-start; gap: 10px; }
      .item-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #f0f0f0; font-size: 11px; font-weight: 700; color: #555; flex-shrink: 0; margin-top: 1px; }
      .item-company { font-size: 14px; font-weight: 600; }
      .item-role { font-size: 12px; color: #666; margin-top: 1px; }
      .exp-summary { color: #444; font-size: 12px; line-height: 1.6; white-space: pre-wrap; margin-top: 6px; }

      /* 기술 태그 */
      .tech-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
      .tech-pill { display: inline-block; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 10px; padding: 1px 8px; font-size: 10px; color: #555; }

      /* Bullets */
      .bullets { padding-left: 18px; margin: 0; }
      .bullets li { font-size: 12px; color: #333; margin-bottom: 2px; }

      /* Metrics */
      .metrics { display: flex; flex-wrap: wrap; gap: 5px; }
      .metric-pill { display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 2px 8px; font-size: 10px; color: #065f46; }
      .metric-pill strong { margin-right: 3px; }
    </style>
  </head>
  <body>
    <main>
      <div class="header">
        <h1>${title}</h1>
        ${metaLine ? `<p class="meta">${metaLine}</p>` : ""}
        <p class="date">수정일: ${updatedAt}</p>
      </div>
      ${summaryHtml}
      <div class="items-title">경력 항목</div>
      ${itemsHtml}
    </main>
  </body>
</html>`;
}

/**
 * 이력서를 PDF 파일로 직접 다운로드 (팝업 없음)
 * html2canvas + jsPDF를 사용하여 브라우저 내에서 생성
 */
export async function downloadResumePdfFile(preview: ResumePdfPreview): Promise<void> {
  const { downloadHtmlAsPdf } = await import("@/lib/pdf-download");
  const html = buildResumePdfHtml(preview);
  const filename = createResumePdfFileName(preview.resume.title);
  await downloadHtmlAsPdf(html, filename);
}

export function openResumePdfPrintWindow(preview: ResumePdfPreview): PdfOpenResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "UNAVAILABLE_WINDOW" };
  }

  const html = buildResumePdfHtml(preview);
  const fileName = createResumePdfFileName(preview.resume.title);

  // 1차 시도: 빈 탭 열기
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = fileName;
    printWindow.focus();
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // 인쇄 다이얼로그 실패 시 사용자가 수동 저장 가능
      }
    }, 250);
    return { ok: true };
  }

  // 2차 시도 (팝업 차단 우회): Blob URL
  try {
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const fallbackWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (fallbackWindow) {
      fallbackWindow.focus();
      // Blob URL은 탭이 열린 후 해제
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return { ok: true };
    }
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Blob API 미지원 환경
  }

  return { ok: false, reason: "POPUP_BLOCKED" };
}
