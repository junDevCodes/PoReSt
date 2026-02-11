import {
  applySortOrderByIndex,
  reorderResumeItems,
  type ResumeReorderItem,
} from "@/app/(private)/app/resumes/_lib/reorder";

describe("resume reorder", () => {
  it("드래그한 항목을 목표 위치 앞으로 이동해야 한다", () => {
    // 준비: 정렬된 항목 목록
    const items: ResumeReorderItem[] = [
      { id: "a", sortOrder: 10 },
      { id: "b", sortOrder: 20 },
      { id: "c", sortOrder: 30 },
    ];

    // 실행: c를 a 앞으로 이동
    const reordered = reorderResumeItems(items, "c", "a");

    // 검증: 순서가 c, a, b로 바뀌어야 한다
    expect(reordered.map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("유효하지 않은 이동 요청이면 원본 순서를 유지해야 한다", () => {
    // 준비: 정렬된 항목 목록
    const items: ResumeReorderItem[] = [
      { id: "a", sortOrder: 10 },
      { id: "b", sortOrder: 20 },
    ];

    // 실행: 없는 ID를 대상으로 이동 시도
    const reordered = reorderResumeItems(items, "x", "b");

    // 검증: 순서가 유지되어야 한다
    expect(reordered.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("재정렬 후 sortOrder를 간격 10으로 재계산해야 한다", () => {
    // 준비: 섞인 sortOrder
    const items: ResumeReorderItem[] = [
      { id: "c", sortOrder: 3 },
      { id: "a", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ];

    // 실행: 인덱스 기준 sortOrder 재계산
    const recalculated = applySortOrderByIndex(items);

    // 검증: 순서 기반으로 10씩 증가해야 한다
    expect(recalculated).toEqual([
      { id: "c", sortOrder: 10 },
      { id: "a", sortOrder: 20 },
      { id: "b", sortOrder: 30 },
    ]);
  });
});
