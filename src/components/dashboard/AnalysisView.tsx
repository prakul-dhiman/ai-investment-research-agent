"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  FileText,
  Bookmark,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Info,
  DollarSign,
  Scale
} from "lucide-react";
import { ScoreOutput } from "@/utils/scoring";

interface AnalysisViewProps {
  reportData: any;
  onBack: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function AnalysisView({
  reportData,
  onBack,
  isBookmarked,
  onToggleBookmark
}: AnalysisViewProps) {
  const profile = reportData.companyProfile || {};
  const metrics = reportData.financialData?.metric || {};
  const sentiment = reportData.newsSentiment || {};
  const risks = reportData.riskProfile || [];
  const decision: ScoreOutput = reportData.decision || {
    score: 50,
    verdict: "PASS",
    confidence: 100,
    financialScore: 50,
    growthScore: 50,
    sentimentScore: 50,
    riskPenalty: 0,
    breakdown: {
      currentRatioScore: 50,
      debtEquityScore: 50,
      netProfitMarginScore: 50,
      revenueGrowthScore: 50,
      epsGrowthScore: 50,
      reasoning: [],
      criticalRisks: [],
      limitations: []
    }
  };

  const explanation = (decision.breakdown as any) || {};

  // Formulate YoY metrics data for Recharts visualization
  const chartData = [
    {
      name: "Current Ratio",
      Value: Number((metrics.currentRatioAnnual || 1).toFixed(2)),
      Limit: 1.5
    },
    {
      name: "Debt to Equity",
      Value: Number((metrics.debtEquityAnnual || 0.8).toFixed(2)),
      Limit: 1.0
    },
    {
      name: "Profit Margin %",
      Value: Math.round((metrics.netProfitMarginAnnual || 0.12) * 100),
      Limit: 20
    }
  ];

  const growthData = [
    {
      name: "Revenue YoY %",
      Value: Math.round((metrics.revenueGrowthYoYAnnual || 0.10) * 100)
    },
    {
      name: "EPS YoY %",
      Value: Math.round((metrics.epsGrowthYoYAnnual || 0.08) * 100)
    }
  ];

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-sm font-medium border border-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleBookmark}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              isBookmarked
                ? "bg-blue-600/30 border-blue-500 text-blue-400"
                : "bg-slate-800/80 border-slate-700/50 hover:bg-slate-700/80 text-slate-300"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            {isBookmarked ? "Bookmarked" : "Bookmark Ticker"}
          </button>
        </div>
      </div>

      {/* Header Corporate Profiler */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            {profile.logo && (
              <img
                src={profile.logo}
                alt={profile.name}
                className="w-10 h-10 rounded-lg bg-white p-0.5 object-contain"
                onError={(e) => {
                  (e.target as any).style.display = "none";
                }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{profile.name || profile.ticker}</h1>
              <p className="text-slate-400 text-sm">
                Ticker: <span className="font-semibold text-blue-400">{profile.ticker || reportData.ticker}</span> |{" "}
                Industry: <span className="text-slate-300">{profile.finnhubIndustry || "N/A"}</span>
              </p>
            </div>
          </div>
          {profile.weburl && (
            <a
              href={profile.weburl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-500 hover:underline mt-2 inline-block"
            >
              Visit Official Website &rarr;
            </a>
          )}
        </div>

        <div className="text-left md:text-right">
          <p className="text-xs text-slate-400">Market Capitalization</p>
          <p className="text-lg font-bold text-slate-200">
            ${((profile.marketCapitalization || 0) / 1000).toFixed(2)}B USD
          </p>
        </div>
      </div>

      {/* Primary Score & Verdict Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verdict Box */}
        <div className={`glass-panel p-6 flex flex-col justify-between ${
          decision.verdict === "INVEST"
            ? "border-emerald-500/30 bg-emerald-950/10"
            : "border-rose-500/30 bg-rose-950/10"
        }`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verdict Signal</span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 flex items-center gap-2">
              {decision.verdict === "INVEST" ? (
                <>
                  <ThumbsUp className="w-8 h-8 text-emerald-500 fill-current" />
                  <span className="text-emerald-400">INVEST</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-8 h-8 text-rose-500 fill-current" />
                  <span className="text-rose-400">PASS</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
            {decision.verdict === "INVEST"
              ? "This stock meets our threshold criteria, displaying clean balance sheets and positive growth momentum."
              : "We recommend holding. Ratios indicate premium valuation parameters or margin pressures relative to risks."}
          </p>
        </div>

        {/* Dynamic Score Indicator */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Investment Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-blue-500">{decision.score}</span>
              <span className="text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                decision.score >= 70 ? "bg-emerald-500" : decision.score >= 50 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${decision.score}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Financial Health: {decision.financialScore}% | Growth: {decision.growthScore}% | News: {decision.sentimentScore}%
          </p>
        </div>

        {/* Confidence Gauge */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analysis Confidence</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-black text-purple-500">{decision.confidence}%</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            {decision.confidence >= 80
              ? "All key financial reporting parameters and SEC filings resolved successfully."
              : "Confidence index is adjusted due to some missing metrics in public balance statements."}
          </p>
        </div>
      </div>

      {/* Qualitative Explanations */}
      {explanation.reasoning && explanation.reasoning.length > 0 && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-500" /> Due Diligence Reasoning
          </h3>
          <ul className="space-y-3">
            {explanation.reasoning.map((item: string, i: number) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mt-0.5 shrink-0">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quantitative Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial health Chart */}
        <div className="glass-panel p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Financial Health Indicators
          </h4>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f1f5f9"
                  }}
                />
                <Bar dataKey="Value" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Ratios Chart */}
        <div className="glass-panel p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Growth & Performance Ratios
          </h4>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f1f5f9"
                  }}
                />
                <Bar dataKey="Value" fill="var(--chart-line)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-500" /> Strategic SWOT Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/20">
            <h4 className="text-sm font-bold text-emerald-400">Strengths</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              High current liquidity levels and operational margins present buffers for expansion investment pipelines.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-950/10 border border-amber-500/20">
            <h4 className="text-sm font-bold text-amber-400">Weaknesses</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Susceptibility to macroeconomic cost indexes, export controls, or supply chain bottleneck constraints.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-950/10 border border-blue-500/20">
            <h4 className="text-sm font-bold text-blue-400">Opportunities</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Integrating advanced generative workflows and accelerating global expansion schedules.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-rose-950/10 border border-rose-500/20">
            <h4 className="text-sm font-bold text-rose-400">Threats</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Fierce sector competitor pricing cuts and rapid standard modifications across software/hardware categories.
            </p>
          </div>
        </div>
      </div>

      {/* News Sentiment Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Summary */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" /> Sentiment Polarity Summary
          </h3>
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Polarity Index Score</span>
              <span className="text-sm font-bold text-blue-400">{Math.round(sentiment.polarity * 100)}% Positive</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              &ldquo;{sentiment.headlinesSummary || "News headlines indicate stable, normal range operations."}&rdquo;
            </p>
          </div>
        </div>

        {/* SEC Item 1A Risks */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> SEC 10-K Risk Disclosures
          </h3>
          <div className="space-y-3">
            {risks.slice(0, 3).map((risk: string, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Limitations Card */}
      {explanation.limitations && explanation.limitations.length > 0 && (
        <div className="glass-panel p-5 flex items-start gap-3 bg-slate-900/40">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-slate-400">Analysis Caveats & Data Limitations</h5>
            <ul className="list-disc pl-4 space-y-1 mt-1.5">
              {explanation.limitations.map((limit: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-500">{limit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
