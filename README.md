# AI Investment Research Agent

This repository contains the source code for the **AI Investment Research Agent** take-home assignment, built using the Next.js App Router, LangChain/LangGraph, and Prisma.

---

## 1. Overview
The **AI Investment Research Agent** is a professional financial due diligence platform designed to reduce initial research time for any public US stock ticker. It orchestrates a stateful multi-agent system to fetch financials, scrape recent Google News feeds, analyze SEC 10-K risk factors, run a custom math-based valuation and risk-adjusted scoring algorithm, and output a clear `INVEST` or `PASS` recommendation accompanied by an explainable AI justification.

### Core Features:
*   **Search Landing & Screener**: Quick shortcut queries for mega-cap stocks alongside watchlist bookmarks and saved history lists.
*   **SSE Logs Console**: Streams real-time progress events from the backend LangGraph node transitions to the user interface, demonstrating the agent's work under the hood.
*   **Analytics Dashboard**: Visualizes the investment score, verdict, confidence index, SWOT strategic quadrants, YoY financial bar charts, and news sentiment polarity.

---

## 2. How it Works (Approach & Architecture)

The system uses **LangGraph.js** to manage stateful multi-agent execution loops:

```
[START]
   │
   ▼
[Research Node] ────► Fetches CIK and corporate profile from Finnhub / SEC EDGAR.
   │
   ▼
[Financials Node] ──► Extracts Balance Sheets, current ratios, margins, YoY metrics.
   │
   ▼
[News Node] ────────► Scrapes Google News RSS & Finnhub. Analyzes sentiment via Gemini.
   │
   ▼
[Risk Node] ────────► Extracts Item 1A Risk Factors from SEC 10-K filings.
   │
   ▼
[Decision Node] ────► Runs quantitative math score & compiles Gemini explanation.
   │
   ▼
[END]
```

### Node Descriptions:
1.  **Research Node (`src/agents/nodes.ts`)**: Resolves the ticker to standard corporate profiles, exchange metadata, and CIK mappings.
2.  **Financials Node (`src/agents/nodes.ts`)**: Loads financial reports and tracks fundamental ratios (Profit Margin, Debt/Equity, Current Ratio) and growth rates.
3.  **News Node (`src/agents/nodes.ts`)**: Gathers headlines, de-duplicates them, and computes news sentiment polarity (0 to 1) using Gemini structured JSON outputs.
4.  **Risk Node (`src/agents/nodes.ts`)**: Retrieves Item 1A Risk Disclosures from SEC EDGAR.
5.  **Decision Node (`src/agents/nodes.ts`)**: Runs our quantitative scoring algorithm in code (reducing LLM math hallucinations), runs the final Gemini evaluation, and packages the verdict, confidence levels, SWOT assessments, and reasoning items.

---

## 3. How to Run it

### Prerequisites
*   Node.js (v18+)
*   NPM (v9+)

### Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd ai-investment-research-agent
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the project root and add your API keys:
    ```env
    DATABASE_URL="file:./dev.db"
    GEMINI_API_KEY="your-gemini-api-key"
    FINNHUB_API_KEY="your-finnhub-api-key"
    ```
    *(Note: If you run it without keys, the services automatically fallback to deterministic hash-based mock values for any ticker, making the app fully interactive and demo-ready immediately out-of-the-box).*

4.  **Run Database Migrations & Generate client**:
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```

5.  **Start the Dev Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

6.  **Run Tests**:
    ```bash
    npm run test
    ```

---

## 4. Key Decisions & Trade-offs

### What We Chose & Why:
1.  **Prisma 7 & SQLite**: We chose Prisma 7 with the Better SQLite3 adapter for local development. SQLite requires zero configuration for testing out-of-the-box. Prisma 7's configuration moves connection URLs out of the schema to `prisma.config.ts`, making it simple to hot-swap to PostgreSQL (via Neon/Supabase) for production Vercel runs without database-level schema changes.
2.  **Quantitative Calculations in Code**: We perform all basic arithmetic ratios and penalty calculations in standard TypeScript code rather than trusting the LLM. LLMs are notorious for calculation errors and hallucinating values. We pass the final calculated math scores to Gemini for strategic synthesis.
3.  **Server-Sent Events (SSE)**: We chose SSE for real-time progress updates instead of WebSockets. SSE runs over standard HTTP, has automatic reconnection, and fits serverless function lifecycles (like Vercel Edge functions) without maintaining stateful TCP connections.
4.  **Dynamic Mock Hashing**: If API keys are missing, we use a deterministic hash function on the search query. This guarantees that searching for different tickers returns distinct charts, SWOT highlights, and verdicts, rather than identical outputs, during local presentations.

### What We Left Out:
*   **Vector DB / RAG (for now)**: For initial due diligence, long context windows (1M+ on Gemini) allow passing filings directly. We chose to skip complex vector chunking in this version to optimize latency and costs.
*   **NextAuth Session Guards**: Kept user routing open to a default workspace to simplify local setup, but structured the database models (`userId`) to support integration with auth platforms easily.

---

## 5. Example Runs

### Example 1: NVDA (Verdicts: INVEST | Score: 85/100)
*   **Financials**: Net Margin 49%, low leverage (Debt/Equity: 0.12), revenue growth YoY +120%.
*   **Sentiment**: 85% Positive. "Nvidia Blackwell chip production and cloud hyperscaler demand are driving overwhelmingly positive sentiment."
*   **SWOT Opportunities**: AI Data center expansion, high Net margins.

### Example 2: TSLA (Verdicts: PASS | Score: 58/100)
*   **Financials**: Current Ratio 1.65, Net Margin 11%, Revenue Growth 18%.
*   **Sentiment**: 52% Neutral/Mixed. "EV pricing cuts and delivery goals show mixed reviews."
*   **SWOT Risks**: pricing competition from local Chinese EV brands, battery ramp yields.

---

## 6. What we would improve with more time
*   **Semantic caching**: Cache LLM responses using semantic similarity to avoid duplicate API calls for identical or related queries.
*   **Historical Filings RAG**: Implement vector search using `pgvector` on historical earnings call transcripts to enable conversational Q&A for past metrics.
*   **PDF Export Node**: Incorporate a serverless PDF generator to download polished financial summary reports directly from the dashboard.
*   **Multi-Turn Agent Chat**: Add a chatbot interface alongside the static dashboard to let advisors query the agent about specific SWOT lines.

---

## 7. Bonus Points: LLM Chat Transcript Included!
As mandated by the Altuni AI Labs take-home criteria, the **full conversational agent development chat logs** are included. You can inspect the step-by-step logs, thinking trajectories, and code design decisions made during the creation of this project here:
📂 [agent_chat_transcript.jsonl](./agent_chat_transcript.jsonl)
