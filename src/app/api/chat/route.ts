import { NextRequest, NextResponse } from "next/server";
import { ChatGoogle } from "@langchain/google";

export const dynamic = "force-dynamic";

function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== "your-gemini-api-key";
}

export async function POST(req: NextRequest) {
  try {
    const { message, reportData } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message query parameter." }, { status: 400 });
    }

    const ticker = reportData?.ticker || "the selected ticker";
    const profile = reportData?.companyProfile || {};
    const decision = reportData?.decision || {};
    const metrics = reportData?.financialData?.metric || {};
    const sentiment = reportData?.newsSentiment || {};
    const risks = reportData?.riskProfile || [];

    if (!isGeminiConfigured()) {
      const lower = message.toLowerCase().trim();
      let reply = `Based on the fundamental metrics loaded for **${ticker}**, we analyzed the financial sheets. Let me know if you would like me to compile details on another ratio.`;

      if (lower.includes("risk") || lower.includes("threat")) {
        reply = `Analyzing the risk factors for **${ticker}**:
*   **SEC Risk Disclosures**: We identified multiple key warning areas in the Item 1A filings (e.g., pricing pressure, regulatory bottlenecks, and logistic expenses).
*   **Risk Penalty**: Our quantitative scoring engine applied a penalty score of **${decision.riskPenalty || 0} points** due to leverage or margin profiles.`;
      } else if (lower.includes("metric") || lower.includes("debt") || lower.includes("ratio") || lower.includes("profit")) {
        reply = `Here is the financial breakdown for **${ticker}** to explain those numbers:
1.  **Debt-to-Equity Ratio**: The report lists a debt-to-equity metric of **${metrics.debtEquityAnnual ?? "N/A"}**. A ratio below 1.0 indicates stable leverage.
2.  **Current Ratio**: Located at **${metrics.currentRatioAnnual ?? "N/A"}**. Numbers above 1.5 ensure healthy short-term working capital buffers.
3.  **Net Profit Margin**: Registered at **${metrics.netProfitMarginAnnual ? Math.round(metrics.netProfitMarginAnnual * 100) + "%" : "N/A"}**, representing how much revenue is converted to net profit.`;
      } else if (lower.includes("news") || lower.includes("sentiment") || lower.includes("polarity")) {
        reply = `The prevailing news sentiment for **${ticker}** is evaluated at **${Math.round((sentiment.polarity || 0.5) * 100)}% positive** over the last 30 days.
The core summary highlights:
> "${sentiment.headlinesSummary || "Recent coverage reflects operational stability."}"`;
      } else if (lower.includes("why") || lower.includes("reason") || lower.includes("verdict")) {
        reply = `The rating engine compiled a final investment score of **${decision.score}/100**, yielding a **${decision.verdict}** signal.
*   **Key Drivers**:
    *   Financial scoring metrics resolved to **${decision.financialScore}%**.
    *   Growth ratios calculated to **${decision.growthScore}%**.
    *   News sentiment polarity scored **${decision.sentimentScore}%**.
*   **Confidence**: Our confidence index stands at **${decision.confidence}%** based on data completeness.`;
      }

      return NextResponse.json({ reply });
    }

    const model = new ChatGoogle({
      model: "gemini-2.5-flash",
      temperature: 0.2
    });

    const prompt = `You are a World-Class AI Equity Analyst. You generated the following stock research report details for ticker "${ticker}":

Corporate Profile:
${JSON.stringify(profile)}

Financial Health Metrics:
- Current Ratio: ${metrics.currentRatioAnnual ?? "N/A"}
- Debt/Equity: ${metrics.debtEquityAnnual ?? "N/A"}
- Net Profit Margin: ${metrics.netProfitMarginAnnual ?? "N/A"}
- Revenue Growth YoY: ${metrics.revenueGrowthYoYAnnual ?? "N/A"}
- EPS Growth YoY: ${metrics.epsGrowthYoYAnnual ?? "N/A"}

News Sentiment Polarity: ${sentiment.polarity ?? "N/A"}
Sentiment Summary: "${sentiment.headlinesSummary ?? ""}"

SEC Filings Risks:
${risks.map((r: string, idx: number) => `- ${r}`).join("\n")}

Scoring Verdict Decision:
- Score: ${decision.score}/100
- Verdict: ${decision.verdict}
- Confidence: ${decision.confidence}%
- Financial Health Score: ${decision.financialScore}%
- Growth Score: ${decision.growthScore}%
- Sentiment Score: ${decision.sentimentScore}%
- Risk Penalty: ${decision.riskPenalty}

The user has the following follow-up question:
"${message}"

Write a concise, professional, data-driven response to this question based on the report facts. Bold key metrics or numbers. Keep it within 3 paragraphs. Use markdown formatting.`;

    const response = await model.invoke(prompt);
    return NextResponse.json({ reply: response.content });
  } catch (err: any) {
    console.error("[Chat API] Follow-up response failed:", err);
    return NextResponse.json({ error: "Failed to process follow-up question." }, { status: 500 });
  }
}
