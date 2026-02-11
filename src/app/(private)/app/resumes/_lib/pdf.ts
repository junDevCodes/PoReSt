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

function toJsonText(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
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

export function buildResumePdfHtml(preview: ResumePdfPreview): string {
  const title = toSafeText(preview.resume.title);
  const updatedAt = escapeHtml(formatDateLabel(preview.resume.updatedAt));
  const company = toSafeText(preview.resume.targetCompany);
  const role = toSafeText(preview.resume.targetRole);
  const level = toSafeText(preview.resume.level);
  const summary = toSafeText(preview.resume.summaryMd);
  const itemsHtml = preview.items
    .map((item) => {
      const techTags =
        item.resolvedTechTags.length > 0
          ? escapeHtml(item.resolvedTechTags.join(", "))
          : "-";

      return `
        <article class="item">
          <h3>${escapeHtml(String(item.sortOrder))}. ${toSafeText(item.experience.company)} / ${toSafeText(item.experience.role)}</h3>
          <p class="summary">${toSafeText(item.experience.summary)}</p>
          <p><strong>기술:</strong> ${techTags}</p>
          <pre class="code">bullets: ${escapeHtml(toJsonText(item.resolvedBulletsJson))}</pre>
          <pre class="code">metrics: ${escapeHtml(toJsonText(item.resolvedMetricsJson))}</pre>
          <p><strong>메모:</strong> ${toSafeText(item.notes)}</p>
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
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #101217; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width: 100%; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      h2 { margin: 24px 0 10px; font-size: 18px; border-bottom: 1px solid #d9dce3; padding-bottom: 6px; }
      h3 { margin: 0 0 6px; font-size: 15px; }
      p { margin: 4px 0; }
      .meta { color: #3b4150; }
      .item { break-inside: avoid; border: 1px solid #e6e8ef; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
      .summary { color: #3b4150; white-space: pre-wrap; }
      .code { white-space: pre-wrap; background: #f7f8fb; border: 1px solid #eceef4; border-radius: 6px; padding: 8px; font-size: 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p class="meta"><strong>수정일:</strong> ${updatedAt}</p>
      <p class="meta"><strong>대상 회사:</strong> ${company}</p>
      <p class="meta"><strong>대상 직무:</strong> ${role}</p>
      <p class="meta"><strong>레벨:</strong> ${level}</p>
      <h2>요약</h2>
      <p>${summary}</p>
      <h2>경력 항목</h2>
      ${itemsHtml}
    </main>
  </body>
</html>`;
}

export function openResumePdfPrintWindow(preview: ResumePdfPreview): PdfOpenResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "UNAVAILABLE_WINDOW" };
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    return { ok: false, reason: "POPUP_BLOCKED" };
  }

  const html = buildResumePdfHtml(preview);
  const fileName = createResumePdfFileName(preview.resume.title);
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
