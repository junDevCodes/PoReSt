/**
 * 공통 PDF 다운로드 유틸리티
 * jspdf + html2canvas-pro를 dynamic import로 코드 스플리팅하여 사용
 * html2canvas-pro: oklab/oklch 등 현대 CSS 색상 함수 네이티브 지원
 */

async function loadDeps() {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);
  return { jsPDF, html2canvas };
}

/**
 * jsPDF의 pdf.save()는 일부 환경에서 window.open(blobUrl)으로 fallback되어
 * 새 탭만 열리고 다운로드가 안 된다. <a download> 트리거 방식으로 강제 다운로드.
 */
function triggerPdfDownload(pdfInstance: { output(type: "arraybuffer"): ArrayBuffer }, filename: string): void {
  const arrayBuffer = pdfInstance.output("arraybuffer");
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * 크로스오리진 이미지를 Data URL로 변환하여 html2canvas CORS 문제 회피.
 * 변환 실패 시 이미지를 조용히 숨김.
 */
async function resolveImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.allSettled(
    imgs.map(async (img) => {
      if (!img.src || img.src.startsWith("data:") || img.src.startsWith("blob:")) return;
      try {
        const res = await fetch(img.src);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        img.style.display = "none";
      }
    }),
  );
}

/** HTMLElement를 캡처하여 A4 PDF로 다운로드 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  backgroundColor = "#ffffff",
): Promise<void> {
  if (typeof window === "undefined") return;

  const { jsPDF, html2canvas } = await loadDeps();

  // 크로스오리진 이미지를 Data URL로 사전 변환
  await resolveImages(element);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor,
    allowTaint: false,
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

  triggerPdfDownload(pdf, filename);
}

/**
 * HTML 문자열을 임시 DOM에 주입하여 PDF로 다운로드
 * buildResumePdfHtml() 등 HTML 빌더 결과를 직접 사용할 때 활용
 */
export async function downloadHtmlAsPdf(
  html: string,
  filename: string,
  backgroundColor = "#ffffff",
): Promise<void> {
  if (typeof window === "undefined") return;

  // HTML 파싱 후 스타일 + 본문 추출
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const styleText = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");

  // 임시 컨테이너 생성 (A4 너비 794px 고정, 화면 밖으로)
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:794px;background:${backgroundColor};`;

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
    await downloadElementAsPdf(targetEl, filename, backgroundColor);
  } finally {
    document.body.removeChild(container);
  }
}
