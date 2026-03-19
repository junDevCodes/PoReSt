import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("포트폴리오 모바일 반응형", () => {
  test("모바일 뷰포트에서 홈 페이지가 정상 렌더링된다", async ({
    page,
  }) => {
    // iPhone 14 기준 뷰포트
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`/portfolio/${SLUG}`);

    // 스트리밍 완료 대기
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();

    // 주요 섹션 존재
    await expect(
      page.getByText("대표 프로젝트", { exact: false })
    ).toBeVisible();

    // 스크롤 가능 확인 (페이지 높이 > 뷰포트)
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(bodyHeight).toBeGreaterThan(844);
  });
});
