/**
 * 공통 PDF 다운로드 유틸리티
 * jspdf + html2canvas를 dynamic import로 코드 스플리팅하여 사용
 */

async function loadDeps() {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  return { jsPDF, html2canvas };
}

/** HTMLElement를 캡처하여 A4 PDF로 다운로드 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  backgroundColor = "#ffffff",
): Promise<void> {
  if (typeof window === "undefined") return;

  const { jsPDF, html2canvas } = await loadDeps();

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pdfW) / canvas.width;

  // 멀티페이지 처리
  pdf.addImage(imgData, "JPEG", 0, 0, pdfW, imgH);
  let remaining = imgH - pdfH;
  let offsetY = pdfH;
  while (remaining > 0) {
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, -offsetY, pdfW, imgH);
    remaining -= pdfH;
    offsetY += pdfH;
  }

  pdf.save(filename);
}

/**
 * HTML 문자열을 임시 DOM에 주입하여 PDF로 다운로드
 * buildResumePdfHtml() 등 HTML 빌더 결과를 직접 사용할 때 활용
 */
export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  if (typeof window === "undefined") return;

  // HTML 파싱 후 스타일 + 본문 추출
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const styleText = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");

  // 임시 컨테이너 생성 (A4 너비 794px 고정, 화면 밖으로)
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;background:#fff;";

  const styleEl = document.createElement("style");
  styleEl.textContent = styleText;
  container.appendChild(styleEl);

  const bodyEl = document.createElement("div");
  bodyEl.innerHTML = doc.body.innerHTML;
  container.appendChild(bodyEl);

  document.body.appendChild(container);
  // CSS 렌더링 대기
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

  try {
    const targetEl = (container.querySelector("main") ?? bodyEl) as HTMLElement;
    await downloadElementAsPdf(targetEl, filename, "#ffffff");
  } finally {
    document.body.removeChild(container);
  }
}
