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
 * html2canvas가 지원하지 않는 현대 CSS 색상 함수(oklab, oklch)를 rgba()로 변환.
 * Tailwind v4가 oklab()을 기본 출력하므로 PDF 캡처 전 반드시 적용 필요.
 */

/** linear sRGB → sRGB 감마 보정 */
function linearToGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clamp255(v: number): number {
  return Math.round(Math.min(255, Math.max(0, v * 255)));
}

/** oklab(L, a, b) → [r, g, b] (0-255) */
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  // OKLab → LMS (cube root domain)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  // LMS cube root → LMS linear
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS linear → linear sRGB
  const rl = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [clamp255(linearToGamma(rl)), clamp255(linearToGamma(gl)), clamp255(linearToGamma(bl))];
}

/** oklch(L, C, H) → [r, g, b] (0-255) */
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return oklabToRgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
}

function sanitizeCssForCanvas(css: string): string {
  return css
    .replace(/oklab\(([^)]+)\)/g, (_match, inner: string) => {
      const [channels, alphaPart] = inner.split("/");
      const parts = (channels ?? "").trim().split(/\s+/).map(parseFloat);
      const L = Number.isFinite(parts[0]) ? parts[0] : 0;
      const a = Number.isFinite(parts[1]) ? parts[1] : 0;
      const b = Number.isFinite(parts[2]) ? parts[2] : 0;
      const alpha = alphaPart != null ? parseFloat(alphaPart.trim()) : 1;
      const [r, g, bl] = oklabToRgb(L, a, b);
      return Number.isFinite(alpha) && alpha < 1
        ? `rgba(${r},${g},${bl},${alpha})`
        : `rgb(${r},${g},${bl})`;
    })
    .replace(/oklch\(([^)]+)\)/g, (_match, inner: string) => {
      const [channels, alphaPart] = inner.split("/");
      const parts = (channels ?? "").trim().split(/\s+/).map(parseFloat);
      const L = Number.isFinite(parts[0]) ? parts[0] : 0;
      const C = Number.isFinite(parts[1]) ? parts[1] : 0;
      const H = Number.isFinite(parts[2]) ? parts[2] : 0;
      const alpha = alphaPart != null ? parseFloat(alphaPart.trim()) : 1;
      const [r, g, b] = oklchToRgb(L, C, H);
      return Number.isFinite(alpha) && alpha < 1
        ? `rgba(${r},${g},${b},${alpha})`
        : `rgb(${r},${g},${b})`;
    });
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

  // iframe으로 완전 격리 — html2canvas가 원본 페이지의 oklab() 스타일시트에 접근하지 않음
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:0;border:none;";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(
      `<!doctype html><html lang="ko"><head><meta charset="utf-8">` +
      `<style>${sanitizeCssForCanvas(styleText)}</style></head>` +
      `<body style="margin:0;background:${backgroundColor};">${doc.body.innerHTML}</body></html>`,
    );
    iframeDoc.close();

    // CSS 렌더링 대기
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    iframe.style.height = `${iframeDoc.body.scrollHeight}px`;

    const targetEl = (iframeDoc.querySelector("main") ?? iframeDoc.body) as HTMLElement;
    await downloadElementAsPdf(targetEl, filename, backgroundColor);
  } finally {
    document.body.removeChild(iframe);
  }
}
