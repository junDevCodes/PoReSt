import { test, expect } from "@playwright/test";

test.describe("이력서 공유 페이지", () => {
  test("무효 토큰으로 접근 시 에러가 표시된다", async ({ page }) => {
    await page.goto("/resume/share/invalid-token-xxx");

    // 에러 메시지 또는 rose 배경 에러 UI 존재
    const errorBox = page.locator(".bg-rose-50");
    const errorText = page.getByText("찾을 수 없", { exact: false });

    // 로딩 후 둘 중 하나 표시
    await expect(errorBox.or(errorText)).toBeVisible();
  });
});
