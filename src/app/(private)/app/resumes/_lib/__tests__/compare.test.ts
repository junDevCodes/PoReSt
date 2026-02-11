import { resolveResumeItemComparison } from "@/app/(private)/app/resumes/_lib/compare";

describe("resume item comparison", () => {
  it("오버라이드 값이 있으면 resolved 값에 반영해야 한다", () => {
    // 준비: 원본 경력 + 오버라이드 값
    const comparison = resolveResumeItemComparison({
      experience: {
        bulletsJson: ["원본 불릿"],
        metricsJson: { conversion: "10%" },
        techTags: ["TypeScript", "Prisma"],
      },
      overrideBulletsJson: ["수정 불릿"],
      overrideMetricsJson: { conversion: "18%" },
      overrideTechTags: ["Next.js"],
    });

    // 검증: resolved가 오버라이드 값을 사용해야 한다
    expect(comparison.resolved.bulletsJson).toEqual(["수정 불릿"]);
    expect(comparison.resolved.metricsJson).toEqual({ conversion: "18%" });
    expect(comparison.resolved.techTags).toEqual(["Next.js"]);
    expect(comparison.hasOverride).toEqual({
      bullets: true,
      metrics: true,
      techTags: true,
    });
  });

  it("오버라이드 값이 없으면 원본 값을 유지해야 한다", () => {
    // 준비: 오버라이드가 비어 있는 입력
    const comparison = resolveResumeItemComparison({
      experience: {
        bulletsJson: ["원본 불릿"],
        metricsJson: { conversion: "10%" },
        techTags: ["TypeScript", "Prisma"],
      },
      overrideBulletsJson: null,
      overrideMetricsJson: null,
      overrideTechTags: [],
    });

    // 검증: resolved가 원본 값과 동일해야 한다
    expect(comparison.resolved.bulletsJson).toEqual(["원본 불릿"]);
    expect(comparison.resolved.metricsJson).toEqual({ conversion: "10%" });
    expect(comparison.resolved.techTags).toEqual(["TypeScript", "Prisma"]);
    expect(comparison.hasOverride).toEqual({
      bullets: false,
      metrics: false,
      techTags: false,
    });
  });
});
