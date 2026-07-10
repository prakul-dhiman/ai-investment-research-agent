import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import {
  researchNode,
  financialsNode,
  newsNode,
  riskNode,
  decisionNode
} from "./nodes";

// Compile state graph nodes into a sequential processing pipeline
// We use "decisionAgent" as the node name to avoid conflict with the "decision" state channel
const workflow = new StateGraph(AgentState)
  .addNode("research", researchNode)
  .addNode("financials", financialsNode)
  .addNode("news", newsNode)
  .addNode("risk", riskNode)
  .addNode("decisionAgent", decisionNode)
  
  .addEdge(START, "research")
  .addEdge("research", "financials")
  .addEdge("financials", "news")
  .addEdge("news", "risk")
  .addEdge("risk", "decisionAgent")
  .addEdge("decisionAgent", END);

export const agentPipeline = workflow.compile();
