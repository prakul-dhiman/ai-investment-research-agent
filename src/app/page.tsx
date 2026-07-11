"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  History,
  TrendingUp,
  AlertCircle,
  Bookmark,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldCheck,
  Flame,
  Activity,
  Sliders,
  Settings,
  X
} from "lucide-react";
import { AnalysisView } from "@/components/dashboard/AnalysisView";

interface HistoryRecord {
  id: string;
  ticker: string;
  score: number;
  verdict: string;
  createdAt: string;
}

export default function Home() {
  const [tickerInput, setTickerInput] = useState("");
  const [step, setStep] = useState<"SEARCH" | "LOGS" | "RESULT">("SEARCH");
  
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [activeReport, setActiveReport] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  useEffect(() => {
    fetchHistoryData();
  }, []);

  async function fetchHistoryData() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
        setBookmarks(data.bookmarks || []);
      }
    } catch (err) {
      console.error("Failed to load historical analytics records:", err);
    }
  }

  function triggerAnalysis(targetTicker: string) {
    const query = targetTicker.trim();
    if (!query || !/^[a-zA-Z0-9\s\.\-]{1,30}$/.test(query)) {
      setErrorMessage("Please enter a valid stock ticker or company name (1-30 characters).");
      return;
    }

    setErrorMessage("");
    setPipelineLogs([]);
    setCurrentAgent("Supervisor");
    setCurrentMessage("Opening server analytics pipeline...");
    setStep("LOGS");

    const eventSource = new EventSource(`/api/analyze?ticker=${encodeURIComponent(query)}`);

    eventSource.addEventListener("log", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setCurrentAgent(data.agent);
        setCurrentMessage(data.message);
        setPipelineLogs((prev) => [...prev, `[${data.agent}] ${data.message}`]);
      } catch (err) {
        console.error("Error parsing log event:", err);
      }
    });

    eventSource.addEventListener("complete", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setActiveReport(data.reportData);
        setStep("RESULT");
        eventSource.close();
        fetchHistoryData();
      } catch (err) {
        console.error("Error parsing complete event:", err);
        setErrorMessage("Failed to decode final report parameters.");
        setStep("SEARCH");
        eventSource.close();
      }
    });

    eventSource.addEventListener("error", (e: any) => {
      let msg = "The analysis stream encountered a server-side timeout or rate limit.";
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          msg = data.message || msg;
        } catch {}
      }
      setErrorMessage(msg);
      setStep("SEARCH");
      eventSource.close();
    });
  }

  async function loadHistoricalReport(id: string) {
    try {
      const res = await fetch(`/api/report?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data.reportData);
        setStep("RESULT");
      } else {
        setErrorMessage("This report could not be resolved from the database.");
      }
    } catch (err) {
      setErrorMessage("Failed to resolve historical report.");
    }
  }

  async function toggleBookmark(ticker: string) {
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, action: "bookmark" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bookmarked) {
          setBookmarks((prev) => [...prev, ticker]);
        } else {
          setBookmarks((prev) => prev.filter((b) => b !== ticker));
        }
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  }

  async function deleteHistoryRecord(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "delete" })
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error("Error deleting history record:", err);
    }
  }

  return (
    <main className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-[#090d16] grid-pattern">
      {/* Background Decorative Mesh Glows */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] glow-sphere-1 rounded-full blur-[140px] pointer-events-none select-none animate-glow-1"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] glow-sphere-2 rounded-full blur-[140px] pointer-events-none select-none animate-glow-2"></div>
      <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] glow-sphere-3 rounded-full blur-[120px] pointer-events-none select-none"></div>

      {/* Header NavBar */}
      <header className="border-b border-white/5 bg-[#090d16]/45 backdrop-blur-2xl px-8 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black tracking-tight text-base text-slate-100">SmartAgent</span>
            <span className="ml-2.5 text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-wider">
              Workspace v2.0
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 print:hidden">
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-indigo-500" /> SEC EDGAR & FINNHUB LIVE
          </span>
        </div>
      </header>

      {/* Workspace Area split */}
      <div className="flex-1 w-full flex flex-col md:flex-row z-10 relative">
        
        {/* Left Workspace Settings & History Sidebar */}
        {step === "SEARCH" && (
          <aside className="w-full md:w-80 border-r border-white/5 bg-[#0b0f1a]/45 backdrop-blur-2xl p-6 space-y-8 flex flex-col shrink-0 print:hidden">
            {/* Risk profile selection */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Analyst Parameters
              </h4>
              <div className="p-1 rounded-xl bg-slate-950/80 border border-white/5 flex gap-1">
                {(["conservative", "moderate", "aggressive"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskTolerance(r)}
                    className={`flex-1 py-2 text-[9px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                      riskTolerance === r
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Watchlist bookmarks list */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> Bookmarks Watchlist
              </h4>
              {bookmarks.length === 0 ? (
                <p className="text-[10px] text-slate-500 bg-slate-950/20 p-3.5 rounded-xl border border-white/5 leading-relaxed font-semibold">
                  No bookmark saved yet. Run analyses and bookmark from report.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {bookmarks.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setTickerInput(b);
                        triggerAnalysis(b);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {b} <ArrowRight className="w-3 h-3 text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Past Report Logs list */}
            <div className="flex-1 flex flex-col min-h-48 space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-indigo-400" /> Recent Research Logs
              </h4>
              
              {historyList.length === 0 ? (
                <p className="text-[10px] text-slate-500 bg-slate-950/20 p-3.5 rounded-xl border border-white/5 font-semibold">
                  No past report logs found.
                </p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[320px] pr-1">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoricalReport(item.id)}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`min-w-[36px] px-1.5 h-8 rounded-lg flex items-center justify-center text-[9px] font-black tracking-wider shrink-0 ${
                          item.verdict === "INVEST" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                        }`}>
                          {item.ticker}
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            Score: {item.score}
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${
                              item.verdict === "INVEST"
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                            }`}>
                              {item.verdict}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryRecord(item.id, e)}
                        className="text-[8px] text-slate-500 hover:text-rose-400 px-1.5 py-1 rounded bg-slate-900 border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Panel Core Workspace */}
        <div className="flex-1 flex flex-col justify-center w-full min-w-0">
          
          {step === "SEARCH" && (
            <div className="max-w-3xl mx-auto w-full px-8 py-16 space-y-12">
              
              {/* Core Hero Banner */}
              <div className="text-center space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" /> Venture Grade Financial Diligence
                </span>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-100 leading-none">
                  Research any public <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">
                    company with AI.
                  </span>
                </h1>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed font-semibold">
                  A multi-agent quantitative analyst pipeline. Standardizes balance metrics, computes risk heatmaps, and tracks real-time news sentiment.
                </p>
              </div>

              {/* Main Search Command Bar */}
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerAnalysis(tickerInput);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl input-premium backdrop-blur-xl duration-300"
                >
                  <div className="flex-1 flex items-center gap-3 px-3">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={(e) => setTickerInput(e.target.value)}
                      placeholder="Enter company name or ticker (e.g. Apple, NVDA)"
                      className="w-full bg-transparent border-0 outline-none text-slate-100 placeholder-slate-600 text-xs font-semibold focus:ring-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold tracking-wider uppercase text-slate-100 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    Analyze
                  </button>
                </form>

                {errorMessage && (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 text-rose-400 text-[11px] font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Tag Screener shortcuts */}
              <div className="flex flex-wrap justify-center items-center gap-2.5 text-[10px]">
                <span className="text-slate-500 font-extrabold uppercase tracking-wider mr-1">Trending:</span>
                {["Apple", "NVIDIA", "Tesla", "Microsoft", "Amazon"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setTickerInput(preset);
                      triggerAnalysis(preset);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 hover:text-indigo-400 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loader screen thinking panels */}
          {step === "LOGS" && (
            <div className="max-w-xl mx-auto w-full px-8 py-16 space-y-6 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-14 h-14 rounded-full border border-indigo-500/30 animate-ping"></div>
                <div className="p-4 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 z-10">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-base font-black tracking-tight text-slate-200 flex items-center justify-center gap-2 uppercase">
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" /> Pipeline Reasoning Panel
                </h2>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                  Active Thread: <span className="text-indigo-400 font-bold">{currentAgent}</span>
                </p>
              </div>

              {/* Real-time reasoning timeline console */}
              <div className="w-full p-4 rounded-2xl bg-slate-950/80 border border-white/5 font-mono text-[10px] text-slate-400 space-y-2 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                {pipelineLogs.map((log, index) => {
                  const isLast = index === pipelineLogs.length - 1;
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-indigo-500 shrink-0 select-none">&gt;</span>
                      <span className={isLast ? "text-indigo-400 flex items-center gap-1.5 font-bold animate-pulse" : ""}>
                        {log}
                        {isLast && (
                          <span className="inline-block animate-ping w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {pipelineLogs.length === 0 && (
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <span className="animate-ping w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    <span>Connecting to multi-agent state pipeline...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results dashboard display */}
          {step === "RESULT" && activeReport && (
            <AnalysisView
              reportData={activeReport}
              isBookmarked={bookmarks.includes(activeReport.ticker)}
              onToggleBookmark={() => toggleBookmark(activeReport.ticker)}
              onBack={() => setStep("SEARCH")}
            />
          )}
        </div>
      </div>

      {/* Footer bar */}
      <footer className="border-t border-white/5 bg-[#090d16]/45 px-8 py-4 flex items-center justify-between text-[10px] text-slate-500 z-10 print:hidden">
        <p>&copy; {new Date().getFullYear()} SmartAgent Research, Inc.</p>
        <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Bloomberg Grade AI Framework
        </p>
      </footer>
    </main>
  );
}
