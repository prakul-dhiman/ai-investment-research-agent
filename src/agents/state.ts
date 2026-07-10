import { Annotation } from "@langchain/langgraph";
import { FinnhubProfile, FinnhubMetric } from "@/services/finnhub";
import { ScoreOutput } from "@/utils/scoring";

export interface NewsSentimentData {
  polarity: number; // 0 to 1
  articleCount: number;
  headlinesSummary: string;
}

export const AgentState = Annotation.Root({
  ticker: Annotation<string>(),
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
  riskProfile: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  decision: Annotation<ScoreOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;
