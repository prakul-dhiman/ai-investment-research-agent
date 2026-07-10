import { calculateInvestmentScore } from "../src/utils/scoring";

describe("Quantitative Investment Scoring Engine", () => {
  test("returns INVEST verdict for healthy financial profiles", () => {
    const healthyMetrics = {
      currentRatio: 1.8,
      debtEquity: 0.5,
      netProfitMargin: 0.25, // 25%
      revenueGrowth: 0.15,  // 15%
      epsGrowth: 0.10,      // 10%
      sentimentPolarity: 0.8 // 80% positive news
    };

    const result = calculateInvestmentScore(healthyMetrics);
    
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.verdict).toBe("INVEST");
    expect(result.confidence).toBe(100); // All 6 parameters provided
    expect(result.financialScore).toBeGreaterThanOrEqual(80);
    expect(result.growthScore).toBeGreaterThanOrEqual(60);
  });

  test("returns PASS verdict and applies penalty points for poor financial indicators", () => {
    const highDebtNegativeMarginMetrics = {
      currentRatio: 0.8,     // below 1.0 triggers penalty
      debtEquity: 2.8,       // above 2.0 triggers penalty
      netProfitMargin: -0.05, // negative margin triggers penalty
      revenueGrowth: -0.02,
      epsGrowth: -0.08,
      sentimentPolarity: 0.4
    };

    const result = calculateInvestmentScore(highDebtNegativeMarginMetrics);

    expect(result.score).toBeLessThan(50);
    expect(result.verdict).toBe("PASS");
    expect(result.riskPenalty).toBe(30); // Max capped penalty (15 + 15 + 10 capped at 30)
  });

  test("calculates confidence level correctly based on missing parameters", () => {
    // Provide only 3 out of 6 parameters (currentRatio, netProfitMargin, sentimentPolarity)
    const partialMetrics = {
      currentRatio: 1.6,
      netProfitMargin: 0.18,
      sentimentPolarity: 0.7
    };

    const result = calculateInvestmentScore(partialMetrics);

    // 3 missing metrics should drop confidence to 50%
    expect(result.confidence).toBe(50);
    // Since confidence < 75%, verdict should automatically resolve to PASS
    expect(result.verdict).toBe("PASS");
  });
});
