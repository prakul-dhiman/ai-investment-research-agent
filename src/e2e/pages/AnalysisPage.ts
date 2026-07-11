import { type Page, expect } from "@playwright/test";

function buildSSEBody(ticker: string, verdict: "INVEST" | "PASS", score: number, confidence: number) {
  const reportData = {
    ticker,
    companyProfile: {
      name: "Mock Corp",
      ticker,
      logo: "",
      finnhubIndustry: "Technology",
      weburl: "",
      marketCapitalization: 500000,
      shareOutstanding: 100,
    },
    financialData: {
      metric: {
        currentRatioAnnual: 2.1,
        debtEquityAnnual: 0.5,
        netProfitMarginAnnual: 0.25,
        revenueGrowthYoYAnnual: 0.15,
        epsGrowthYoYAnnual: 0.12,
      },
    },
    newsSentiment: {
      polarity: verdict === "INVEST" ? 0.75 : 0.2,
      articleCount: 5,
      headlinesSummary: verdict === "INVEST" ? "Positive outlook" : "Negative outlook",
    },
    riskProfile: ["Market competition"],
    decision: {
      score,
      verdict,
      confidence,
      financialScore: verdict === "INVEST" ? 80 : 30,
      growthScore: verdict === "INVEST" ? 70 : 20,
      sentimentScore: verdict === "INVEST" ? 75 : 25,
      riskPenalty: 0,
      breakdown: {
        currentRatioScore: verdict === "INVEST" ? 100 : 40,
        debtEquityScore: verdict === "INVEST" ? 100 : 40,
        netProfitMarginScore: verdict === "INVEST" ? 100 : 30,
        revenueGrowthScore: verdict === "INVEST" ? 70 : 20,
        epsGrowthScore: verdict === "INVEST" ? 60 : 15,
      },
    },
  };

  const lines = [
    `event: log\ndata: ${JSON.stringify({ agent: "Supervisor", status: "RUNNING", message: "Initializing pipeline..." })}\n`,
    `event: log\ndata: ${JSON.stringify({ agent: "Research", status: "RUNNING", message: "Resolved profile" })}\n`,
    `event: complete\ndata: ${JSON.stringify({ reportId: "mock-1", ticker, verdict, score, confidence, reportData })}\n`,
  ];

  return lines.join("\n");
}

export class AnalysisPage {
  readonly page: Page;
  readonly searchInput;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(
      "Enter company name or ticker (e.g. Apple, NVDA)"
    );
  }

  async goto() {
    await this.page.goto("/");
  }

  async mockAndAnalyze(ticker: string) {
    const body = buildSSEBody(ticker, "INVEST", 85, 90);

    await this.page.route("**/api/analyze**", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body,
      })
    );

    await this.goto();
    await this.searchInput.fill(ticker);
    await this.searchInput.press("Enter");
  }

  async mockAndAnalyzePass(ticker: string) {
    const body = buildSSEBody(ticker, "PASS", 45, 90);

    await this.page.route("**/api/analyze**", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body,
      })
    );

    await this.goto();
    await this.searchInput.fill(ticker);
    await this.searchInput.press("Enter");
  }

  async expectVerdictToBe(status: string) {
    await expect(this.page.getByText(status)).toBeVisible({ timeout: 10_000 });
  }
}
