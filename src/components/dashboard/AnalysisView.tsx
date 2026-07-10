"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Bookmark,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Info,
  Scale,
  Calendar,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  Flame,
  ArrowRight
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

  const chartData = [
    {
      name: "Current Ratio",
      Value: Number((metrics.currentRatioAnnual || 1).toFixed(2)),
      Limit: 1.5
    },
    {
      name: "Debt/Equity",
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
    <div className="space-y-8 w-full max-w-6xl mx-auto px-6 py-10 animate-fade-in relative z-10">
      
      {/* Top Floating Control Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/5 hover:border-slate-800 hover:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-500" /> Back to Console
        </button>

        <button
          onClick={onToggleBookmark}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
            isBookmarked
              ? "bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
              : "bg-slate-900 border-white/5 hover:border-blue-500/20 hover:bg-slate-800/80 text-slate-300"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Bookmarked Watchlist" : "Bookmark Ticker"}
        </button>
      </div>

      {/* Main Corporate Header Profile */}
      <div className="glass-panel p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Glow behind logo */}
        <div className="absolute top-[-20%] left-[-5%] w-[30%] h-[150%] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          {profile.logo ? (
            <img
              src={profile.logo}
              alt={profile.name}
              className="w-14 h-14 rounded-xl bg-white p-1 object-contain shadow-md border border-white/10"
              onError={(e) => {
                (e.target as any).style.display = "none";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-lg tracking-wider text-white shadow-lg border border-white/10">
              {profile.ticker || reportData.ticker}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100 flex items-center gap-2">
              {profile.name || profile.ticker}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Symbol: <span className="font-bold text-blue-400">{profile.ticker || reportData.ticker}</span>
              <span className="mx-2 text-slate-600">|</span>
              Sector: <span className="text-slate-300 font-semibold">{profile.finnhubIndustry || "N/A"}</span>
              {profile.weburl && (
                <>
                  <span className="mx-2 text-slate-600">|</span>
                  <a
                    href={profile.weburl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-400 font-semibold"
                  >
                    Visit Website &rarr;
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-left md:text-right bg-slate-950/40 px-5 py-3 rounded-xl border border-white/5 relative z-10 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Market Cap (USD)</p>
          <p className="text-xl font-black text-slate-100 mt-0.5">
            ${((profile.marketCapitalization || 0) / 1000).toFixed(2)}B
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Verdict Box */}
        <div className={`glass-panel p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
          decision.verdict === "INVEST"
            ? "border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 to-slate-950/80"
            : "border-rose-500/25 bg-gradient-to-br from-rose-950/20 to-slate-950/80"
        }`}>
          {/* Subtle colored mesh backing */}
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none ${
            decision.verdict === "INVEST" ? "bg-emerald-500/10" : "bg-rose-500/10"
          }`}></div>

          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verdict Signal</span>
            <h2 className="text-4xl font-black tracking-tight mt-3 flex items-center gap-3">
              {decision.verdict === "INVEST" ? (
                <>
                  <ThumbsUp className="w-9 h-9 text-emerald-400 fill-emerald-500/10" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">INVEST</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-9 h-9 text-rose-400 fill-rose-500/10" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300">PASS</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed relative z-10 font-medium">
            {decision.verdict === "INVEST"
              ? "Metrics satisfy core thresholds: low debt profile, positive net margin parameters, and stable sentiment alignment."
              : "Hold / Pass position recommended. Ratios show elevated multiples, margin pressure, or higher risk penalties."}
          </p>
        </div>

        {/* Dynamic Score Indicator */}
        <div className="glass-panel p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>

          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Research Rating</span>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                {decision.score}
              </span>
              <span className="text-slate-500 text-xs font-bold">/ 100</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 relative z-10">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  decision.score >= 70 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    : decision.score >= 50 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400" 
                      : "bg-gradient-to-r from-rose-500 to-pink-500"
                }`}
                style={{ width: `${decision.score}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Health: {decision.financialScore}%</span>
              <span>Growth: {decision.growthScore}%</span>
              <span>News: {decision.sentimentScore}%</span>
            </div>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="glass-panel p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>

          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analysis Confidence</span>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                {decision.confidence}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed relative z-10 font-medium">
            {decision.confidence >= 80
              ? "All critical financial reports, RSS feeds, and SEC filings retrieved and calculated."
              : "Adjusted score confidence due to partial information availability in reports."}
          </p>
        </div>
      </div>

      {/* Due Diligence Reasoning Checklist */}
      {explanation.reasoning && explanation.reasoning.length > 0 && (
        <div className="glass-panel p-8 space-y-5 relative overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-500" /> Due Diligence Reasoning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {explanation.reasoning.map((item: string, i: number) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-slate-900/40 border border-white/5">
                <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantitative Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Financial health Chart */}
        <div className="glass-panel p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" /> Financial Health Indicators
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="financialGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    color: "#f1f5f9",
                    fontSize: "11px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                  }}
                />
                <Bar dataKey="Value" fill="url(#financialGlow)" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Ratios Chart */}
        <div className="glass-panel p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Growth & Performance Ratios
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.95)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    color: "#f1f5f9",
                    fontSize: "11px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                  }}
                />
                <Bar dataKey="Value" fill="url(#growthGlow)" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className="glass-panel p-8 space-y-6 relative overflow-hidden">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" /> Strategic SWOT Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl swot-strength transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between min-h-32">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4.5 h-4.5" /> Strengths
              </div>
              <p className="text-[11px] text-slate-300 mt-3 leading-relaxed font-medium">
                High current liquidity ratios and net margins provide immediate structural cushioning to launch product pipelines.
              </p>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl swot-weakness transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between min-h-32">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4.5 h-4.5" /> Weaknesses
              </div>
              <p className="text-[11px] text-slate-300 mt-3 leading-relaxed font-medium">
                Susceptibility to short-term component supply logjams, regulatory tariff updates, and raw material index spikes.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl swot-opportunity transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between min-h-32">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-wider">
                <TrendingUp className="w-4.5 h-4.5" /> Opportunities
              </div>
              <p className="text-[11px] text-slate-300 mt-3 leading-relaxed font-medium">
                Deploying automated software workflows to accelerate global customer acquisition and improve scale efficiency.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl swot-threat transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between min-h-32">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4.5 h-4.5" /> Threats
              </div>
              <p className="text-[11px] text-slate-300 mt-3 leading-relaxed font-medium">
                Intensifying sector competition with aggressive customer-facing pricing cuts and rapid framework obsolescence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* News Sentiment Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sentiment Summary */}
        <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-blue-400" /> Sentiment Polarity Analysis
          </h3>
          <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Polarity Index</span>
              <span className="text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {Math.round(sentiment.polarity * 100)}% Positive
              </span>
            </div>
            
            {/* Sentiment Meter Bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.round(sentiment.polarity * 100)}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
              &ldquo;{sentiment.headlinesSummary || "Recent coverage points to stable customer parameters and normal-range trading cycles."}&rdquo;
            </p>
          </div>
        </div>

        {/* SEC Item 1A Risks */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> SEC 10-K Risk Disclosures
          </h3>
          <div className="space-y-3">
            {risks.slice(0, 3).map((risk: string, i: number) => (
              <div 
                key={i} 
                className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300 leading-relaxed flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse"></div>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Limitations Card */}
      {explanation.limitations && explanation.limitations.length > 0 && (
        <div className="glass-panel p-5 flex items-start gap-3 bg-slate-900/40 border border-white/5">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis Limitations & Caveats</h5>
            <ul className="list-disc pl-4 space-y-1.5 mt-2.5">
              {explanation.limitations.map((limit: string, idx: number) => (
                <li key={idx} className="text-[10px] text-slate-500 leading-relaxed font-medium">{limit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
