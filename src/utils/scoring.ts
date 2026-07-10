export interface ScoringMetrics {
  currentRatio?: number;
  debtEquity?: number;
  netProfitMargin?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  sentimentPolarity?: number;
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
  
  let debtEquityScore = 100;
  if (metrics.debtEquity === undefined) {
    missingCount++;
    debtEquityScore = 50;
  } else if (metrics.debtEquity > 2.0) {
    debtEquityScore = 0;
  } else if (metrics.debtEquity > 1.0) {
    debtEquityScore = 100 - (metrics.debtEquity - 1.0) * 50;
  }

  let netProfitMarginScore = 100;
  if (metrics.netProfitMargin === undefined) {
    missingCount++;
    netProfitMarginScore = 50;
  } else if (metrics.netProfitMargin < 0) {
    netProfitMarginScore = 0;
  } else if (metrics.netProfitMargin < 0.20) {
    netProfitMarginScore = metrics.netProfitMargin * 500;
  }

  let currentRatioScore = 100;
  if (metrics.currentRatio === undefined) {
    missingCount++;
    currentRatioScore = 50;
  } else if (metrics.currentRatio < 1.0) {
    currentRatioScore = 0;
  } else if (metrics.currentRatio < 1.5) {
    currentRatioScore = 100 - (1.5 - metrics.currentRatio) * 200;
  }

  const financialScore = Math.round(
    0.4 * debtEquityScore + 0.4 * netProfitMarginScore + 0.2 * currentRatioScore
  );

  let revenueGrowthScore = 100;
  if (metrics.revenueGrowth === undefined) {
    missingCount++;
    revenueGrowthScore = 50;
  } else if (metrics.revenueGrowth < -0.1) {
    revenueGrowthScore = 0;
  } else if (metrics.revenueGrowth < 0.25) {
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

  let sentimentScore = 50;
  if (metrics.sentimentPolarity === undefined) {
    missingCount++;
  } else {
    sentimentScore = Math.round(metrics.sentimentPolarity * 100);
  }

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
  riskPenalty = Math.min(riskPenalty, 30);

  const baseScore = 0.4 * financialScore + 0.3 * growthScore + 0.3 * sentimentScore;
  const score = Math.max(0, Math.min(100, Math.round(baseScore - riskPenalty)));

  const totalMetrics = 6;
  const confidence = Math.round(((totalMetrics - missingCount) / totalMetrics) * 100);

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
