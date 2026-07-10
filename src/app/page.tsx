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
  Database
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
  
  // Pipeline status states
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [currentAgent, setCurrentAgent] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Completed report structures
  const [activeReport, setActiveReport] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<HistoryRecord[]>([]);

  // Load history records and bookmarks on mount
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
        // Re-fetch history to include the newly created report
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

  // Load a previously saved report from db
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

  // Bookmark toggling
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

  // Delete history item
  async function deleteHistoryRecord(id: string, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent loading report
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
    <main className="min-height-screen w-full flex flex-col justify-between">
      {/* Header NavBar */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-500" />
          <span className="font-extrabold tracking-tight text-xl text-slate-100">SmartAgent</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            Investment Research Agent
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://finnhub.io"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-slate-300 transition-colors"
          >
            <Database className="w-3.5 h-3.5" /> Powered by Finnhub & SEC
          </a>
        </div>
      </header>

      {/* Main Body Router */}
      <div className="flex-1 w-full flex flex-col">
        {step === "SEARCH" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-12 space-y-10 w-full">
            {/* Title Hero Banner */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-100 leading-tight">
                AI-Driven Investment <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">
                  Due Diligence Agent
                </span>
              </h1>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Input any public US stock ticker to extract financial health indexes, news sentiment polarity, and SEC risk summaries.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="w-full max-w-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerAnalysis(tickerInput);
                }}
                className="flex items-center gap-3 p-1.5 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-lg focus-within:border-blue-500/50 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
              >
                <div className="flex-1 flex items-center gap-2.5 px-3">
                  <Search className="w-5 h-5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    placeholder="Enter company name or ticker (e.g. Apple, NVDA)"
                    className="w-full bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-bold text-slate-100 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Analyze
                </button>
              </form>

              {/* Input validation or general error messages */}
              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Preset watchlists / shortcuts */}
            <div className="flex flex-wrap justify-center items-center gap-2 text-xs">
              <span className="text-slate-500">Popular Screeners:</span>
              {["AAPL", "NVDA", "TSLA"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setTickerInput(preset);
                    triggerAnalysis(preset);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 text-slate-300 font-semibold transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Bottom: Bookmarks & Search History Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              {/* Left Column: Watchlists Bookmarks */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-500" /> Bookmarked Watchlist
                </h3>
                {bookmarks.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No tickers currently bookmarked. Toggle bookmark directly within the dashboard after completing an analysis run.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bookmarks.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setTickerInput(b);
                          triggerAnalysis(b);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 text-xs font-bold transition-all"
                      >
                        {b} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Historical reports list */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-500" /> Recent Search History
                </h3>
                {historyList.length === 0 ? (
                  <p className="text-xs text-slate-500">No past runs found in database.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadHistoricalReport(item.id)}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                            item.verdict === "INVEST" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {item.ticker}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                              Score: {item.score}
                            </p>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteHistoryRecord(item.id, e)}
                          className="text-[10px] text-slate-500 hover:text-rose-400 font-semibold px-2 py-1 rounded bg-slate-800/30 border border-slate-800/80 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
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

        {/* Loading logs tracker screen */}
        {step === "LOGS" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-6 py-12 space-y-6 w-full animate-pulse-slow">
            <div className="p-4 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-200">Executing Agent Pipeline</h2>
              <p className="text-xs text-slate-400">
                Running state nodes: <span className="font-semibold text-blue-400">{currentAgent}</span>
              </p>
            </div>

            {/* Simulated monitor logs panel */}
            <div className="w-full p-4 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-[11px] text-slate-400 space-y-2 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
              {pipelineLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-1.5">
                  <span className="text-blue-500 shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-blue-400 mt-1">
                <span className="animate-ping w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span className="font-bold">{currentMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Result presentation view */}
        {step === "RESULT" && activeReport && (
          <AnalysisView
            reportData={activeReport}
            isBookmarked={bookmarks.includes(activeReport.ticker)}
            onToggleBookmark={() => toggleBookmark(activeReport.ticker)}
            onBack={() => setStep("SEARCH")}
          />
        )}
      </div>

      {/* Footer copyright information */}
      <footer className="border-t border-white/5 bg-slate-950/20 px-6 py-4 flex items-center justify-between text-[11px] text-slate-500">
        <p>&copy; {new Date().getFullYear()} SmartAgent Corp. All rights reserved.</p>
        <p>Investments carry capital risk. Evaluate ratios carefully.</p>
      </footer>
    </main>
  );
}
