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
  Activity
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
    <main className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Mesh Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none select-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none select-none"></div>

      {/* Header NavBar */}
      <header className="border-b border-white/5 bg-slate-950/20 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-black tracking-tight text-lg text-slate-100">SmartAgent</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
              V2.0
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://finnhub.io"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-400 flex items-center gap-1.5 hover:text-slate-300 transition-colors"
          >
            <Database className="w-3.5 h-3.5" /> Powered by Finnhub & SEC
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full flex flex-col justify-center z-10 relative">
        {step === "SEARCH" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-16 space-y-12 w-full">
            {/* Title Hero Banner */}
            <div className="text-center space-y-5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-[11px] text-slate-400 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" /> Next-Gen AI Investment Intelligence
              </span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-100 leading-none">
                AI Investment <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                  Research Agent
                </span>
              </h1>
              <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                Analyze public corporations instantly. Evaluates real-time financial stats, de-duplicates headlines, and parses SEC 10-K risk vectors automatically.
              </p>
            </div>

            {/* Command-Bar Style Search Console */}
            <div className="w-full max-w-xl space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerAnalysis(tickerInput);
                }}
                className="flex items-center gap-3 p-2 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300"
              >
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    placeholder="Enter company name or ticker (e.g. Apple, NVDA)"
                    className="w-full bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 text-sm font-medium focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold tracking-wider uppercase text-slate-100 transition-colors shadow-lg shadow-blue-600/30 btn-glow-blue cursor-pointer"
                >
                  Analyze
                </button>
              </form>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 text-rose-400 text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Ticker screener shortcuts */}
            <div className="flex flex-wrap justify-center items-center gap-2.5 text-[11px]">
              <span className="text-slate-500 font-semibold uppercase tracking-wider mr-1">Popular:</span>
              {["Apple", "NVIDIA", "Tesla", "Microsoft", "Amazon"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setTickerInput(preset);
                    triggerAnalysis(preset);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/5 hover:border-slate-800 hover:bg-slate-800/80 text-slate-300 font-semibold transition-all cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Bottom: Bookmarks & History grid dashboard */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
              {/* Watchlist bookmarks */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                  <Bookmark className="w-4 h-4 text-blue-500" /> Bookmarked Watchlist
                </h3>
                {bookmarks.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-950/20 p-4 rounded-xl border border-white/5">
                    No tickers currently bookmarked. Run an analysis and bookmark it directly from the result page dashboard.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {bookmarks.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setTickerInput(b);
                          triggerAnalysis(b);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        {b} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Historical logs */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                  <History className="w-4 h-4 text-blue-500" /> Recent Search History
                </h3>
                {historyList.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                    No past analyses found.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadHistoricalReport(item.id)}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black tracking-wider ${
                            item.verdict === "INVEST" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {item.ticker}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                              Score: {item.score}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                                item.verdict === "INVEST"
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                  : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                              }`}>
                                {item.verdict}
                              </span>
                            </p>
                            <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteHistoryRecord(item.id, e)}
                          className="text-[9px] text-slate-500 hover:text-rose-400 font-bold px-2 py-1 rounded bg-slate-900 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading console panel */}
        {step === "LOGS" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-6 py-16 space-y-6 w-full">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border border-blue-500/30 animate-ping"></div>
              <div className="p-4 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 z-10">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-base font-bold tracking-tight text-slate-200 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" /> Orchestrating Agent Nodes
              </h2>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                Currently Executing: <span className="font-bold text-blue-400">{currentAgent}</span>
              </p>
            </div>

            {/* Simulated monitor logs panel */}
            <div className="w-full p-4 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-[11px] text-slate-400 space-y-2 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
              {pipelineLogs.map((log, index) => {
                const isLast = index === pipelineLogs.length - 1;
                return (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="text-blue-500 shrink-0">&gt;</span>
                    <span className={isLast ? "text-blue-400 flex items-center gap-1.5 font-bold animate-pulse" : ""}>
                      {log}
                      {isLast && (
                        <span className="inline-block animate-ping w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      )}
                    </span>
                  </div>
                );
              })}
              {pipelineLogs.length === 0 && (
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <span className="animate-ping w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span>Connecting to agent pipeline...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results views dashboard */}
        {step === "RESULT" && activeReport && (
          <AnalysisView
            reportData={activeReport}
            isBookmarked={bookmarks.includes(activeReport.ticker)}
            onToggleBookmark={() => toggleBookmark(activeReport.ticker)}
            onBack={() => setStep("SEARCH")}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/20 px-6 py-4 flex items-center justify-between text-[10px] text-slate-500 z-10">
        <p>&copy; {new Date().getFullYear()} SmartAgent. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Professional Grade Research Engine
        </p>
      </footer>
    </main>
  );
}
