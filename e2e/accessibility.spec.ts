import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SLUG = "jundevcodes";

/**
 * axe-core 접근성 감사
 *
 * 제외 규칙:
 * - color-contrast: Tailwind CSS v4의 oklch()/rgb() 색상 함수를
 *   axe-core가 정확히 평가하지 못함 (text-black/75를 2.31:1로 오판).
 *   색상 대비는 코드 수준에서 수동 검증 완료.
 * - link-in-text-block: pill 스타일 링크(bg-blue-50)가 배경색으로
 *   이미 구분되나 axe가 인식하지 못함.
 */
const DISABLED_RULES = ["color-contrast", "link-in-text-block"];

test.describe("접근성 감사 (axe-core)", () => {
  test("포트폴리오 홈 — Critical/Serious 위반 없음", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    // 스트리밍 SSR 완료 대기
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(DISABLED_RULES)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length}건)`
      );
      expect(critical, `접근성 위반:\n${summary.join("\n")}`).toHaveLength(0);
    }
  });

  test("경력 페이지 — Critical/Serious 위반 없음", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/experiences`);

    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(DISABLED_RULES)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length}건)`
      );
      expect(critical, `접근성 위반:\n${summary.join("\n")}`).toHaveLength(0);
    }
  });

  test("프로젝트 목록 — Critical/Serious 위반 없음", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}/projects`);

    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(DISABLED_RULES)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length}건)`
      );
      expect(critical, `접근성 위반:\n${summary.join("\n")}`).toHaveLength(0);
    }
  });
});
