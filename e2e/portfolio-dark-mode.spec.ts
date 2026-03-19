import { test, expect } from "@playwright/test";

const SLUG = "jundevcodes";

test.describe("포트폴리오 다크모드", () => {
  test("토글 클릭 시 다크 모드로 전환된다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);

    // 스트리밍 완료 대기
    await expect(page.locator("h1").first()).toBeVisible();

    // 초기 상태: light
    const wrapper = page.locator("[data-theme]").first();
    await expect(wrapper).toHaveAttribute("data-theme", "light");

    // 다크 모드 토글 클릭
    const toggleBtn = page.getByRole("button", {
      name: "다크 모드로 전환",
    });
    await toggleBtn.click();

    // dark 전환 확인
    await expect(wrapper).toHaveAttribute("data-theme", "dark");
  });

  test("다크 모드에서 다시 클릭하면 라이트로 복귀한다", async ({ page }) => {
    await page.goto(`/portfolio/${SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible();

    const wrapper = page.locator("[data-theme]").first();

    // 다크 전환
    await page
      .getByRole("button", { name: "다크 모드로 전환" })
      .click();
    await expect(wrapper).toHaveAttribute("data-theme", "dark");

    // 라이트 복귀
    await page
      .getByRole("button", { name: "라이트 모드로 전환" })
      .click();
    await expect(wrapper).toHaveAttribute("data-theme", "light");
  });
});
