export type ResumeItemSyncStatus = "SYNCED" | "OUTDATED" | "UNKNOWN";

function toTimestamp(value: string | Date): number | null {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export function getResumeItemSyncStatus(
  resumeItemUpdatedAt: string | Date,
  experienceUpdatedAt: string | Date,
): ResumeItemSyncStatus {
  const resumeItemTime = toTimestamp(resumeItemUpdatedAt);
  const experienceTime = toTimestamp(experienceUpdatedAt);

  if (resumeItemTime === null || experienceTime === null) {
    return "UNKNOWN";
  }

  if (experienceTime > resumeItemTime) {
    return "OUTDATED";
  }

  return "SYNCED";
}

export function getResumeItemSyncBadgeText(status: ResumeItemSyncStatus): string {
  switch (status) {
    case "SYNCED":
      return "동기화됨";
    case "OUTDATED":
      return "원본 변경됨";
    default:
      return "판별 불가";
  }
}
