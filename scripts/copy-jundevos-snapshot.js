#!/usr/bin/env node
/**
 * jundev-os runtime/*.json → PoReSt/data/jundev-os-snapshot/*.json 동기화.
 *
 * Vercel build에서는 PoReSt 외부의 ../runtime/control-plane/*.json 접근 불가.
 * 따라서 deploy 전 본 스크립트로 PoReSt 내부에 snapshot을 commit.
 *
 * 운영 룰:
 * - 본 스크립트는 단순 raw copy. payload 안 사용자 sensitive data가 있으면 별도 sanitize 필요.
 * - 호출 시점: Vercel deploy commit 직전. CI/git hook X — 사용자 명시 실행만.
 */
const fs = require("node:fs");
const path = require("node:path");

const SRC_DIR = path.resolve(__dirname, "..", "..", "runtime", "control-plane");
const DST_DIR = path.resolve(__dirname, "..", "data", "jundev-os-snapshot");
const FILES = ["events.json", "reports.json", "decisions.json", "content-jobs.json", "workflow-runs.json"];

const VAULT_LIB = path.resolve(__dirname, "..", "..", "services", "control-plane", "lib", "vault.js");
const MONOREPO_ROOT = path.resolve(__dirname, "..", "..");

if (!fs.existsSync(SRC_DIR)) {
  console.warn(
    `[copy-jundevos-snapshot] SRC not found: ${SRC_DIR}. Likely Vercel build context — skipping (commit된 snapshot 사용).`,
  );
  process.exit(0);
}

if (!fs.existsSync(DST_DIR)) {
  fs.mkdirSync(DST_DIR, { recursive: true });
}

const summary = [];
for (const file of FILES) {
  const src = path.join(SRC_DIR, file);
  const dst = path.join(DST_DIR, file);
  if (!fs.existsSync(src)) {
    console.warn(`[copy-jundevos-snapshot] skip (no src): ${file}`);
    summary.push({ file, ok: false, reason: "no src" });
    continue;
  }
  fs.copyFileSync(src, dst);
  const bytes = fs.statSync(dst).size;
  summary.push({ file, ok: true, bytes });
}

// Vault sanitized snapshot (privacy: body 빠짐, meta only)
let vaultStatus = { ok: false, reason: "lib not found" };
if (fs.existsSync(VAULT_LIB)) {
  try {
    const { scanVault, buildVaultIndex, publicVaultIndex } = require(VAULT_LIB);
    const scan = scanVault(MONOREPO_ROOT);
    if (scan.exists) {
      const index = buildVaultIndex(scan);
      const pub = publicVaultIndex(index);
      fs.writeFileSync(path.join(DST_DIR, "vault.json"), JSON.stringify(pub, null, 2));
      vaultStatus = { ok: true, total: pub.counts.total, words: pub.counts.total_words };
    } else {
      vaultStatus = { ok: false, reason: "vault dir missing" };
    }
  } catch (err) {
    vaultStatus = { ok: false, reason: err.message };
  }
}
console.log(`  ${vaultStatus.ok ? "✓" : "○"} vault.json — ${JSON.stringify(vaultStatus)}`);

const stamp = new Date().toISOString();
fs.writeFileSync(
  path.join(DST_DIR, "_meta.json"),
  JSON.stringify({ generated_at: stamp, files: summary, vault: vaultStatus }, null, 2),
);

console.log(`[copy-jundevos-snapshot] ${summary.filter((s) => s.ok).length}/${FILES.length} files synced at ${stamp}`);
for (const s of summary) {
  console.log(`  ${s.ok ? "✓" : "✗"} ${s.file}${s.ok ? ` (${s.bytes}B)` : ` — ${s.reason}`}`);
}
