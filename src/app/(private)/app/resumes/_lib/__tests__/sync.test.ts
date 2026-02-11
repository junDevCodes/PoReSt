import {
  getResumeItemSyncBadgeText,
  getResumeItemSyncStatus,
} from "@/app/(private)/app/resumes/_lib/sync";

describe("resume sync badge", () => {
  it("원본 경력이 더 최신이면 OUTDATED 상태여야 한다", () => {
    const status = getResumeItemSyncStatus(
      "2026-02-09T10:00:00.000Z",
      "2026-02-09T10:00:01.000Z",
    );
    expect(status).toBe("OUTDATED");
  });

  it("이력서 항목이 동일하거나 더 최신이면 SYNCED 상태여야 한다", () => {
    const status = getResumeItemSyncStatus(
      "2026-02-09T10:00:01.000Z",
      "2026-02-09T10:00:01.000Z",
    );
    expect(status).toBe("SYNCED");
  });

  it("날짜 형식이 잘못되면 UNKNOWN 상태여야 한다", () => {
    const status = getResumeItemSyncStatus("invalid-date", "2026-02-09T10:00:01.000Z");
    expect(status).toBe("UNKNOWN");
  });

  it("상태별 한국어 배지 문구를 반환해야 한다", () => {
    expect(getResumeItemSyncBadgeText("OUTDATED")).toBe("원본 변경됨");
    expect(getResumeItemSyncBadgeText("SYNCED")).toBe("동기화됨");
    expect(getResumeItemSyncBadgeText("UNKNOWN")).toBe("판별 불가");
  });
});
