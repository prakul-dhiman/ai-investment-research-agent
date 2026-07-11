import { test, expect } from "@playwright/test";
import { AnalysisPage } from "./pages/AnalysisPage";

test.describe("AI Investment Research Agent — Analysis Flow", () => {
  test("Should display INVEST verdict with mocked API", async ({ page }) => {
    const analysis = new AnalysisPage(page);
    await analysis.mockAndAnalyze("AAPL");
    await analysis.expectVerdictToBe("INVEST");
  });

  test("Should display PASS verdict for weak stock", async ({ page }) => {
    const analysis = new AnalysisPage(page);
    await analysis.mockAndAnalyzePass("WEAK");
    await analysis.expectVerdictToBe("PASS");
  });

  test("Should handle search input correctly", async ({ page }) => {
    const analysis = new AnalysisPage(page);
    await analysis.goto();
    await analysis.searchInput.fill("MSFT");
    await expect(analysis.searchInput).toHaveValue("MSFT");
  });
});
