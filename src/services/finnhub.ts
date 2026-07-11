export interface FinnhubProfile {
  name: string;
  ticker: string;
  logo: string;
  finnhubIndustry: string;
  weburl: string;
  marketCapitalization: number;
  shareOutstanding: number;
}

export interface FinnhubQuote {
  c: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

export interface FinnhubMetric {
  metric: {
    currentRatioAnnual?: number;
    "debtEquityAnnual"?: number;
    "netProfitMarginAnnual"?: number;
    "revenueGrowthYoYAnnual"?: number;
    "epsGrowthYoYAnnual"?: number;
    [key: string]: any;
  };
}

export interface FinnhubNews {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionCode: string;
  transactionPrice: number;
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function getApiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key || key === "your-finnhub-api-key") {
    return null;
  }
  return key;
}

const MOCK_PROFILES: Record<string, FinnhubProfile> = {
  AAPL: {
    name: "Apple Inc.",
    ticker: "AAPL",
    logo: "https://static2.finnhub.io/logo/apple.png",
    finnhubIndustry: "Technology",
    weburl: "https://www.apple.com",
    marketCapitalization: 3400000,
    shareOutstanding: 15400
  },
  TSLA: {
    name: "Tesla Inc.",
    ticker: "TSLA",
    logo: "https://static2.finnhub.io/logo/tesla.png",
    finnhubIndustry: "Automotive",
    weburl: "https://www.tesla.com",
    marketCapitalization: 750000,
    shareOutstanding: 3100
  },
  NVDA: {
    name: "NVIDIA Corp.",
    ticker: "NVDA",
    logo: "https://static2.finnhub.io/logo/nvidia.png",
    finnhubIndustry: "Semiconductors",
    weburl: "https://www.nvidia.com",
    marketCapitalization: 3100000,
    shareOutstanding: 24500
  }
};

const MOCK_QUOTES: Record<string, FinnhubQuote> = {
  AAPL: { c: 220.50, h: 222.00, l: 219.10, o: 219.50, pc: 218.90 },
  TSLA: { c: 245.20, h: 250.10, l: 240.30, o: 241.00, pc: 239.50 },
  NVDA: { c: 125.80, h: 128.50, l: 124.00, o: 124.50, pc: 123.90 }
};

const MOCK_METRICS: Record<string, FinnhubMetric> = {
  AAPL: {
    metric: {
      currentRatioAnnual: 1.25,
      debtEquityAnnual: 1.45,
      netProfitMarginAnnual: 0.26,
      revenueGrowthYoYAnnual: 0.08,
      epsGrowthYoYAnnual: 0.12
    }
  },
  TSLA: {
    metric: {
      currentRatioAnnual: 1.65,
      debtEquityAnnual: 0.15,
      netProfitMarginAnnual: 0.11,
      revenueGrowthYoYAnnual: 0.18,
      epsGrowthYoYAnnual: 0.22
    }
  },
  NVDA: {
    metric: {
      currentRatioAnnual: 3.50,
      debtEquityAnnual: 0.12,
      netProfitMarginAnnual: 0.49,
      revenueGrowthYoYAnnual: 1.25,
      epsGrowthYoYAnnual: 1.50
    }
  }
};

const MOCK_NEWS: Record<string, FinnhubNews[]> = {
  AAPL: [
    {
      id: 1,
      headline: "Apple reveals new AI integrations at WWDC, signaling hardware replacement cycle",
      summary: "Apple announced a deep integration of generative models across its operating systems, driving optimistic estimates from analysts.",
      source: "Tech News Daily",
      url: "https://apple.com",
      datetime: Date.now() / 1000
    },
    {
      id: 2,
      headline: "Supply chain checks indicate strong iPhone shipments in greater Asia region",
      summary: "Shipment schedules for key suppliers suggest robust early consumer demand for Apple's upcoming hardware slate.",
      source: "Supply Chain Insights",
      url: "https://apple.com",
      datetime: Date.now() / 1000 - 3600
    }
  ],
  TSLA: [
    {
      id: 1,
      headline: "Tesla exceeds Q2 delivery targets, margins show slight stabilization signs",
      summary: "Delivery reports beat low analyst expectations, boosting share prices despite continued pricing pressures globally.",
      source: "Electric Transport News",
      url: "https://tesla.com",
      datetime: Date.now() / 1000
    }
  ],
  NVDA: [
    {
      id: 1,
      headline: "Nvidia Blackwell chip production hits full stride amid massive cloud demand",
      summary: "Hyperscalers continue to accelerate capital expenditure on next-generation computing infrastructure, boosting Nvidia order pipeline.",
      source: "Silicon Valley Tech Report",
      url: "https://nvidia.com",
      datetime: Date.now() / 1000
    }
  ]
};

function hashTicker(ticker: string): number {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export class FinnhubService {
  private static getFallbackProfile(ticker: string): FinnhubProfile {
    const cleanTicker = ticker.toUpperCase().trim();
    if (MOCK_PROFILES[cleanTicker]) return MOCK_PROFILES[cleanTicker];
    
    const hash = hashTicker(cleanTicker);
    const sectors = ["Technology", "Finance", "Healthcare", "Consumer Discretionary", "Energy", "Industrials"];
    const industry = sectors[hash % sectors.length];
    
    return {
      name: `${cleanTicker} Corp.`,
      ticker: cleanTicker,
      logo: "",
      finnhubIndustry: industry,
      weburl: `https://www.${cleanTicker.toLowerCase()}.com`,
      marketCapitalization: 10000 + (hash % 990000),
      shareOutstanding: 100 + (hash % 9900)
    };
  }

  private static getFallbackQuote(ticker: string): FinnhubQuote {
    const cleanTicker = ticker.toUpperCase().trim();
    if (MOCK_QUOTES[cleanTicker]) return MOCK_QUOTES[cleanTicker];
    
    const hash = hashTicker(cleanTicker);
    const basePrice = 10 + (hash % 490);
    return {
      c: basePrice,
      h: basePrice * 1.02,
      l: basePrice * 0.98,
      o: basePrice * 0.99,
      pc: basePrice * 1.01
    };
  }

  private static getFallbackMetrics(ticker: string): FinnhubMetric {
    const cleanTicker = ticker.toUpperCase().trim();
    if (MOCK_METRICS[cleanTicker]) return MOCK_METRICS[cleanTicker];
    
    const hash = hashTicker(cleanTicker);
    const currentRatio = 0.8 + (hash % 300) / 100;
    const debtEquity = (hash % 250) / 100;
    const netProfitMargin = ((hash % 60) - 15) / 100;
    const revenueGrowth = ((hash % 100) - 20) / 100;
    const epsGrowth = ((hash % 120) - 30) / 100;

    return {
      metric: {
        currentRatioAnnual: Number(currentRatio.toFixed(2)),
        debtEquityAnnual: Number(debtEquity.toFixed(2)),
        netProfitMarginAnnual: Number(netProfitMargin.toFixed(2)),
        revenueGrowthYoYAnnual: Number(revenueGrowth.toFixed(2)),
        epsGrowthYoYAnnual: Number(epsGrowth.toFixed(2))
      }
    };
  }

  private static getFallbackNews(ticker: string): FinnhubNews[] {
    const cleanTicker = ticker.toUpperCase().trim();
    if (MOCK_NEWS[cleanTicker]) return MOCK_NEWS[cleanTicker];
    
    const hash = hashTicker(cleanTicker);
    const headlinesPool = [
      "announces quarterly dividend yield increase alongside product expansion schedule.",
      "shares climb higher as analyst upgrades target metrics, citing balance sheet buffers.",
      "navigates structural headwinds in East Asia packaging, operations remain in target boundaries.",
      "unveils strategic focus on automated cloud compute networks to compress margins.",
      "consolidates key supply channels, expects moderate operational improvements next quarter."
    ];
    
    const selectedHeadline = headlinesPool[hash % headlinesPool.length];

    return [
      {
        id: 900 + (hash % 100),
        headline: `${cleanTicker} ${selectedHeadline}`,
        summary: `The corporation reported operational summaries reflecting target strategic parameters.`,
        source: "Market Intelligence",
        url: "",
        datetime: Date.now() / 1000
      }
    ];
  }

  static async fetchProfile(ticker: string): Promise<FinnhubProfile> {
    const key = getApiKey();
    if (!key) {
      return this.getFallbackProfile(ticker);
    }

    try {
      const res = await fetchWithTimeout(`${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${key}`, {}, 2000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || Object.keys(data).length === 0) return this.getFallbackProfile(ticker);
      return data;
    } catch (err) {
      return this.getFallbackProfile(ticker);
    }
  }

  static async fetchQuote(ticker: string): Promise<FinnhubQuote> {
    const key = getApiKey();
    if (!key) {
      return this.getFallbackQuote(ticker);
    }

    try {
      const res = await fetchWithTimeout(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${key}`, {}, 2000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || data.c === 0) return this.getFallbackQuote(ticker);
      return data;
    } catch (err) {
      return this.getFallbackQuote(ticker);
    }
  }

  static async fetchMetrics(ticker: string): Promise<FinnhubMetric> {
    const key = getApiKey();
    if (!key) {
      return this.getFallbackMetrics(ticker);
    }

    try {
      const res = await fetchWithTimeout(`${FINNHUB_BASE}/stock/metric?symbol=${ticker}&metric=all&token=${key}`, {}, 2000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.metric) return this.getFallbackMetrics(ticker);
      return data;
    } catch (err) {
      return this.getFallbackMetrics(ticker);
    }
  }

  static async fetchCompanyNews(ticker: string): Promise<FinnhubNews[]> {
    const key = getApiKey();
    if (!key) {
      return this.getFallbackNews(ticker);
    }

    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const fromStr = oneMonthAgo.toISOString().split("T")[0];
      const toStr = new Date().toISOString().split("T")[0];

      const res = await fetchWithTimeout(
        `${FINNHUB_BASE}/company-news?symbol=${ticker}&from=${fromStr}&to=${toStr}&token=${key}`,
        {},
        2500
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return this.getFallbackNews(ticker);
      return data.slice(0, 10);
    } catch (err) {
      return this.getFallbackNews(ticker);
    }
  }

  static async searchSymbol(query: string): Promise<string | null> {
    const key = getApiKey();
    if (!key) {
      const lower = query.toLowerCase().trim();
      if (lower.includes("apple") || lower === "aapl") return "AAPL";
      if (lower.includes("tesla") || lower === "tsla") return "TSLA";
      if (lower.includes("nvidia") || lower === "nvda") return "NVDA";
      if (lower.includes("microsoft") || lower === "msft") return "MSFT";
      if (lower.includes("google") || lower === "goog") return "GOOGL";
      if (lower.includes("amazon") || lower === "amzn") return "AMZN";
      if (lower.includes("meta") || lower === "fb") return "META";
      
      if (/^[a-zA-Z]{1,10}$/.test(query)) {
        return query.toUpperCase().trim();
      }
      return null;
    }

    try {
      const res = await fetchWithTimeout(`${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${key}`, {}, 2000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.result && data.result.length > 0) {
        return data.result[0].symbol;
      }
      return null;
    } catch (err) {
      if (/^[a-zA-Z]{1,10}$/.test(query)) {
        return query.toUpperCase().trim();
      }
      return null;
    }
  }

  /**
   * Fetch insider transactions for a ticker from Finnhub.
   * Falls back to deterministic mock data when API key is missing or request fails.
   */
  static async fetchInsiderTransactions(ticker: string): Promise<InsiderTransaction[]> {
    const key = getApiKey();
    const cleanTicker = ticker.toUpperCase().trim();

    if (!key) {
      return this.getFallbackInsiderData(cleanTicker);
    }

    try {
      const res = await fetchWithTimeout(
        `${FINNHUB_BASE}/stock/insider-transactions?symbol=${encodeURIComponent(cleanTicker)}&token=${key}`,
        {},
        2500
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.data && data.data.length > 0) {
        return data.data.slice(0, 20).map((tx: any) => ({
          name: tx.name || "Unknown Insider",
          share: tx.share || 0,
          change: tx.change || 0,
          filingDate: tx.filingDate || "",
          transactionCode: tx.transactionCode || "",
          transactionPrice: tx.transactionPrice || 0,
        }));
      }

      return this.getFallbackInsiderData(cleanTicker);
    } catch {
      return this.getFallbackInsiderData(cleanTicker);
    }
  }

  private static getFallbackInsiderData(ticker: string): InsiderTransaction[] {
    const hash = hashTicker(ticker);
    const isBullish = hash % 3 !== 0; // 2/3 chance of net-positive insider activity

    const names = ["CEO", "CFO", "COO", "VP Engineering", "Board Member"];
    const baseName = names[hash % names.length];

    return [
      {
        name: `${baseName} - ${ticker}`,
        share: 50000 + (hash % 20000),
        change: isBullish ? 15000 + (hash % 10000) : -(10000 + (hash % 8000)),
        filingDate: new Date(Date.now() - (hash % 30) * 86400000).toISOString().split("T")[0],
        transactionCode: isBullish ? "P" : "S",
        transactionPrice: 100 + (hash % 300),
      },
      {
        name: `Director - ${ticker}`,
        share: 20000 + (hash % 15000),
        change: isBullish ? 8000 + (hash % 5000) : -(5000 + (hash % 4000)),
        filingDate: new Date(Date.now() - ((hash % 30) + 5) * 86400000).toISOString().split("T")[0],
        transactionCode: isBullish ? "P" : "S",
        transactionPrice: 95 + (hash % 280),
      },
      {
        name: `VP Sales - ${ticker}`,
        share: 10000 + (hash % 8000),
        change: isBullish ? 3000 + (hash % 2000) : -(2000 + (hash % 1500)),
        filingDate: new Date(Date.now() - ((hash % 30) + 10) * 86400000).toISOString().split("T")[0],
        transactionCode: isBullish ? "P" : "S",
        transactionPrice: 98 + (hash % 250),
      },
    ];
  }
}
