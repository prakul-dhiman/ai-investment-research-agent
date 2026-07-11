import { Annotation } from "@langchain/langgraph";
import { FinnhubProfile, FinnhubMetric } from "@/services/finnhub";
import { ScoreOutput } from "@/utils/scoring";

export interface NewsSentimentData {
  polarity: number;
  articleCount: number;
  headlinesSummary: string;
}

export interface InsiderSentimentData {
  sentiment: string; // "Strong Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong Bearish"
  netShares: number;
  buyToSellRatio: string;
  allTimeHighBuy: boolean;
  rawTransactions: Array<{ name: string; change: number; filingDate: string }>;
}

export const AgentState = Annotation.Root({
  ticker: Annotation<string>(),
  query: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => "",
  }),
  companyProfile: Annotation<FinnhubProfile | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  financialData: Annotation<FinnhubMetric | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  newsSentiment: Annotation<NewsSentimentData | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  insiderSentiment: Annotation<InsiderSentimentData | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  riskProfile: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  decision: Annotation<ScoreOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  routedNodes: Annotation<string[]>({
    reducer: (_x, y) => y,
    default: () => [],
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;
