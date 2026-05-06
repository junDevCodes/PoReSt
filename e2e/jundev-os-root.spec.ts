import { test, expect } from "@playwright/test";

test.describe("jundev-os public dashboard (root)", () => {
  test("root 페이지에 jundev-os 운영 OS 제목이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/jundev-os/);
    await expect(page.locator("h1").first()).toContainText("개인 운영 OS");
  });

  test("5 시스템 카드가 모두 렌더링된다", async ({ page }) => {
    await page.goto("/");
    for (const key of ["jarvis", "tech", "money", "agents", "integrations"]) {
      await expect(page.getByText(key, { exact: false }).first()).toBeVisible();
    }
  });

  test("최근 이벤트 섹션과 store counts 패널이 보인다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "최근 이벤트" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "store counts" })).toBeVisible();
  });

  test("PoReSt 진입 링크가 SEO 보존된 portfolio path로 연결된다", async ({ page }) => {
    await page.goto("/");
    const portfolioLink = page.getByRole("link", { name: "포트폴리오 보기" });
    await expect(portfolioLink).toBeVisible();
    await expect(portfolioLink).toHaveAttribute("href", "/portfolio/jundevcodes");

    const landingLink = page.getByRole("link", { name: "PoReSt 소개" });
    await expect(landingLink).toBeVisible();
    await expect(landingLink).toHaveAttribute("href", "/landing");
  });

  test("/landing 경로에 기존 PoReSt 마케팅이 보존된다", async ({ page }) => {
    await page.goto("/landing");
    await expect(page).toHaveTitle(/PoReSt/);
    await expect(
      page.getByText("공개 포트폴리오를 운영하고", { exact: false }),
    ).toBeVisible();
  });

  test("/portfolio/jundevcodes SEO 경로가 그대로 작동한다 (회귀 검증)", async ({ page }) => {
    const response = await page.goto("/portfolio/jundevcodes");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Second Brain vault 패널이 vault stats를 표시한다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Second Brain/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "vault stats" })).toBeVisible();
    await expect(page.getByText(/total entries/)).toBeVisible();
    await expect(page.getByText(/total words/)).toBeVisible();
  });

  test("결정 대기열에 음성 명령 버튼이 렌더링된다 (V2)", async ({ page }) => {
    await page.goto("/");
    // 결정 대기열에 1+ open decision이 있으면 음성 버튼 또는 미지원 표시 노출
    const voiceButtons = page.getByRole("button", { name: "음성 명령" });
    const unsupported = page.getByText("🎤 미지원");
    const total = (await voiceButtons.count()) + (await unsupported.count());
    expect(total).toBeGreaterThanOrEqual(1);
  });

  test("Knowledge Graph 섹션과 legend가 렌더링된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Knowledge Graph" })).toBeVisible();
    await expect(page.getByText(/nodes:\s*\d+\s*·\s*edges:\s*\d+/)).toBeVisible();
    await expect(page.getByText("emits / summarizes / raised_by / owned_by / awaits")).toBeVisible();
    for (const sys of ["jarvis", "tech", "money", "agents", "integrations"]) {
      await expect(page.getByText(sys, { exact: true }).first()).toBeVisible();
    }
  });
});
