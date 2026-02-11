export type BlogExportFormat = "html" | "md" | "zip";

export type BlogExportArtifact = {
  contentType: string;
  fileName: string;
  buffer: Buffer;
};

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function getCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugifyTitle(title: string): string {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return normalized.length > 0 ? normalized : "blog-post";
}

function renderMarkdownToHtmlBody(contentMd: string): string {
  const lines = contentMd.split(/\r?\n/);
  const html: string[] = [];
  let inCodeBlock = false;
  const codeLines: string[] = [];

  function flushCodeBlock() {
    if (!inCodeBlock) {
      return;
    }
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines.length = 0;
    inCodeBlock = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    if (line.length === 0) {
      continue;
    }

    if (line.startsWith("### ")) {
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushCodeBlock();
  return html.join("\n");
}

function renderHtmlDocument(title: string, contentMd: string): string {
  const safeTitle = escapeHtml(title);
  const body = renderMarkdownToHtmlBody(contentMd);

  return [
    "<!doctype html>",
    '<html lang="ko">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${safeTitle}</title>`,
    "<style>",
    "body{max-width:860px;margin:40px auto;padding:0 20px;font-family:Arial,sans-serif;line-height:1.7;color:#111;}",
    "h1,h2,h3{line-height:1.35;}",
    "pre{background:#0f172a;color:#e2e8f0;padding:16px;border-radius:8px;overflow:auto;}",
    "code{font-family:Consolas,Monaco,monospace;}",
    "p{margin:0 0 1rem 0;}",
    "</style>",
    "</head>",
    "<body>",
    body,
    "</body>",
    "</html>",
  ].join("\n");
}

function createStoredZipBuffer(entries: Array<{ name: string; content: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const fileNameBytes = Buffer.from(entry.name, "utf8");
    const crc = getCrc32(entry.content);
    const size = entry.content.length;

    const localHeader = Buffer.alloc(30 + fileNameBytes.length);
    localHeader.writeUInt32LE(ZIP_LOCAL_FILE_HEADER_SIGNATURE, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(fileNameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    fileNameBytes.copy(localHeader, 30);

    localParts.push(localHeader, entry.content);

    const centralHeader = Buffer.alloc(46 + fileNameBytes.length);
    centralHeader.writeUInt32LE(ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(fileNameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    fileNameBytes.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    localOffset += localHeader.length + size;
  }

  const centralDirectoryBuffer = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectoryBuffer.length, 12);
  endRecord.writeUInt32LE(localOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectoryBuffer, endRecord]);
}

export function createBlogExportArtifact(input: {
  title: string;
  contentMd: string;
  format: BlogExportFormat;
}): BlogExportArtifact {
  const slug = slugifyTitle(input.title);

  if (input.format === "md") {
    return {
      contentType: "text/markdown; charset=utf-8",
      fileName: `${slug}.md`,
      buffer: Buffer.from(input.contentMd, "utf8"),
    };
  }

  const htmlText = renderHtmlDocument(input.title, input.contentMd);

  if (input.format === "html") {
    return {
      contentType: "text/html; charset=utf-8",
      fileName: `${slug}.html`,
      buffer: Buffer.from(htmlText, "utf8"),
    };
  }

  const zipBuffer = createStoredZipBuffer([
    { name: `${slug}.md`, content: Buffer.from(input.contentMd, "utf8") },
    { name: `${slug}.html`, content: Buffer.from(htmlText, "utf8") },
  ]);

  return {
    contentType: "application/zip",
    fileName: `${slug}-export.zip`,
    buffer: zipBuffer,
  };
}
