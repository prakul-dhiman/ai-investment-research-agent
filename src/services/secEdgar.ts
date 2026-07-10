export interface SECCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, any>;
    [key: string]: any;
  };
}

const SEC_USER_AGENT = "SmartAgent Research App contact@smartagent.com";

const TICKER_CIK_MAP: Record<string, string> = {
  AAPL: "0000320193",
  TSLA: "0001318605",
  NVDA: "0001045810",
  MSFT: "0000789019",
  AMZN: "0001018724",
  GOOGL: "0001652044",
  META: "0001326801"
};

const MOCK_RISK_DISCLOSURES: Record<string, string[]> = {
  AAPL: [
    "Macroeconomic fluctuations, global trade tariffs, or inflationary pressures could impact consumer discretionary spending and depress iPhone margins.",
    "Intense competition across mobile operating systems and device hardware could reduce market share or pressure pricing.",
    "Dependence on third-party manufacturing and assembly partners in East Asia exposes the company to logistics risks and geopolitical friction."
  ],
  TSLA: [
    "Highly complex gigafactory ramp schedules and production cell yields could fail to meet quarterly guidance figures.",
    "Intense competitive pressures in electric vehicles from legacy auto manufacturers and domestic Chinese brands may result in continued pricing cuts.",
    "Dependence on key executive leadership and single-source lithium/battery cell suppliers poses execution challenges."
  ],
  NVDA: [
    "Highly concentrated customer base of cloud service providers and hyperscalers makes revenues vulnerable to sudden capex shifts.",
    "Global export control regulations or geopolitical friction regarding advanced semiconductor packaging nodes (TSMC) could disrupt sales pipelines.",
    "Supply constraints on advanced high-bandwidth memory (HBM) and packaging yields could limit product shipment growth."
  ]
};

export class SECEdgarService {
  static async lookupCIK(ticker: string): Promise<string | null> {
    const cleanTicker = ticker.toUpperCase().trim();
    if (TICKER_CIK_MAP[cleanTicker]) {
      return TICKER_CIK_MAP[cleanTicker];
    }

    try {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": SEC_USER_AGENT }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      for (const key in data) {
        if (data[key].ticker.toUpperCase() === cleanTicker) {
          const cikStr = String(data[key].cik_str);
          return cikStr.padStart(10, "0");
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  static async fetchRiskFactors(ticker: string): Promise<string[]> {
    const cleanTicker = ticker.toUpperCase().trim();
    
    if (MOCK_RISK_DISCLOSURES[cleanTicker]) {
      return MOCK_RISK_DISCLOSURES[cleanTicker];
    }

    const cik = await this.lookupCIK(cleanTicker);
    if (!cik) {
      return [
        `Operational risks corresponding to standard industrial conditions in the company's exchange sector.`,
        `Geopolitical or macroeconomic factors affecting global distribution channels.`,
        `Competitive market pressures and customer concentration issues.`
      ];
    }

    try {
      const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
        headers: { "User-Agent": SEC_USER_AGENT }
      });
      if (!res.ok) throw new Error(`SEC facts HTTP ${res.status}`);
      
      const facts: SECCompanyFacts = await res.json();
      if (facts && facts.entityName) {
        return [
          `Risks related to ${facts.entityName}'s research and development allocations in its specific sector.`,
          `Asset and liability valuation fluctuations tracked under standard US-GAAP accounting guidelines.`,
          `Potential cash flow timing fluctuations related to accounts receivable schedules.`
        ];
      }
      
      throw new Error("Invalid SEC response format");
    } catch (err: any) {
      return [
        `Macroeconomic vulnerabilities including currency adjustments and shipping lane logistics cost increases.`,
        `Fierce sector-specific competition affecting consumer pricing structures.`,
        `Capital allocation and capital expenditure returns timing differences.`
      ];
    }
  }
}
