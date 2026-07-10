export interface ScoringMetrics {
  currentRatio?: number;
  debtEquity?: number;
  netProfitMargin?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  sentimentPolarity?: number; // 0 to 1
}

export interface ScoreOutput {
  score: number;
  verdict: "INVEST" | "PASS";
  confidence: number;
  financialScore: number;
  growthScore: number;
  sentimentScore: number;
  riskPenalty: number;
  breakdown: {
    currentRatioScore: number;
    debtEquityScore: number;
    netProfitMarginScore: number;
    revenueGrowthScore: number;
    epsGrowthScore: number;
  };
}

export function calculateInvestmentScore(metrics: ScoringMetrics): ScoreOutput {
  let missingCount = 0;
  
  // 1. Evaluate Financial Health Score (F)
  let debtEquityScore = 100;
  if (metrics.debtEquity === undefined) {
    missingCount++;
    debtEquityScore = 50; // Neutral fallback
  } else if (metrics.debtEquity > 2.0) {
    debtEquityScore = 0;
  } else if (metrics.debtEquity > 1.0) {
    debtEquityScore = 100 - (metrics.debtEquity - 1.0) * 50; // Linear scale 100 to 50
  }

  let netProfitMarginScore = 100;
  if (metrics.netProfitMargin === undefined) {
    missingCount++;
    netProfitMarginScore = 50; // Neutral fallback
  } else if (metrics.netProfitMargin < 0) {
    netProfitMarginScore = 0;
  } else if (metrics.netProfitMargin < 0.20) {
    netProfitMarginScore = metrics.netProfitMargin * 500; // Linear scale (e.g., 0.10 margin = 50)
  }

  let currentRatioScore = 100;
  if (metrics.currentRatio === undefined) {
    missingCount++;
    currentRatioScore = 50;
  } else if (metrics.currentRatio < 1.0) {
    currentRatioScore = 0;
  } else if (metrics.currentRatio < 1.5) {
    currentRatioScore = 100 - (1.5 - metrics.currentRatio) * 200; // Scale 1.0 (0) to 1.5 (100)
  }

  const financialScore = Math.round(
    0.4 * debtEquityScore + 0.4 * netProfitMarginScore + 0.2 * currentRatioScore
  );

  // 2. Evaluate Growth Score (M)
  let revenueGrowthScore = 100;
  if (metrics.revenueGrowth === undefined) {
    missingCount++;
    revenueGrowthScore = 50;
  } else if (metrics.revenueGrowth < -0.1) {
    revenueGrowthScore = 0;
  } else if (metrics.revenueGrowth < 0.25) {
    // scale from -0.1 (0) to 0.25 (100)
    revenueGrowthScore = ((metrics.revenueGrowth + 0.1) / 0.35) * 100;
  }

  let epsGrowthScore = 100;
  if (metrics.epsGrowth === undefined) {
    missingCount++;
    epsGrowthScore = 50;
  } else if (metrics.epsGrowth < -0.1) {
    epsGrowthScore = 0;
  } else if (metrics.epsGrowth < 0.25) {
    epsGrowthScore = ((metrics.epsGrowth + 0.1) / 0.35) * 100;
  }

  const growthScore = Math.round(0.5 * revenueGrowthScore + 0.5 * epsGrowthScore);

  // 3. Evaluate Sentiment Score (S_news)
  let sentimentScore = 50; // Default neutral fallback
  if (metrics.sentimentPolarity === undefined) {
    missingCount++;
  } else {
    sentimentScore = Math.round(metrics.sentimentPolarity * 100);
  }

  // 4. Calculate Risk Penalties
  let riskPenalty = 0;
  if (metrics.debtEquity !== undefined && metrics.debtEquity > 2.0) {
    riskPenalty += 15;
  }
  if (metrics.netProfitMargin !== undefined && metrics.netProfitMargin < 0) {
    riskPenalty += 15;
  }
  if (metrics.currentRatio !== undefined && metrics.currentRatio < 1.0) {
    riskPenalty += 10;
  }
  riskPenalty = Math.min(riskPenalty, 30); // Max penalty is capped at 30

  // 5. Final Score synthesis
  const baseScore = 0.4 * financialScore + 0.3 * growthScore + 0.3 * sentimentScore;
  const score = Math.max(0, Math.min(100, Math.round(baseScore - riskPenalty)));

  // 6. Confidence Score
  const totalMetrics = 6;
  const confidence = Math.round(((totalMetrics - missingCount) / totalMetrics) * 100);

  // 7. Verdict threshold check
  // An INVEST verdict requires a score >= 70 AND at least 75% confidence (no excessive missing metrics)
  const verdict = score >= 70 && confidence >= 75 ? "INVEST" : "PASS";

  return {
    score,
    verdict,
    confidence,
    financialScore,
    growthScore,
    sentimentScore,
    riskPenalty,
    breakdown: {
      currentRatioScore: Math.round(currentRatioScore),
      debtEquityScore: Math.round(debtEquityScore),
      netProfitMarginScore: Math.round(netProfitMarginScore),
      revenueGrowthScore: Math.round(revenueGrowthScore),
      epsGrowthScore: Math.round(epsGrowthScore)
    }
  };
}
