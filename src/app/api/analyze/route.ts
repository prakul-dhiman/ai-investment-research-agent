import { NextRequest } from "next/server";
import { agentPipeline } from "@/agents/supervisor";
import { prisma } from "@/utils/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase().trim();

  if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
    return new Response(
      JSON.stringify({ error: "Invalid ticker format. Must be 1-5 letters." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const mockUserId = "default-user";
  try {
    await prisma.user.upsert({
      where: { email: "advisor@smartagent.com" },
      update: {},
      create: {
        id: mockUserId,
        email: "advisor@smartagent.com",
        name: "Default Advisor"
      }
    });
  } catch (dbErr: any) {
    console.error("[Analyze API] Database initialization warning:", dbErr.message);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: any) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        sendEvent("log", {
          agent: "Supervisor",
          status: "START",
          message: `Initializing research pipeline for ${ticker}...`
        });

        const streamResults = await agentPipeline.stream(
          { ticker: ticker },
          { streamMode: "updates" }
        );

        let finalState: any = null;

        for await (const chunk of streamResults) {
          const nodeName = Object.keys(chunk)[0];
          const nodeOutput = (chunk as any)[nodeName];

          if (nodeOutput.logs && nodeOutput.logs.length > 0) {
            const latestLog = nodeOutput.logs[nodeOutput.logs.length - 1];
            sendEvent("log", {
              agent: nodeName.charAt(0).toUpperCase() + nodeName.slice(1),
              status: "IN_PROGRESS",
              message: latestLog
            });
          }

          finalState = { ...finalState, ...nodeOutput };
        }

        if (finalState && finalState.decision) {
          const decision = finalState.decision;

          let savedReport = null;
          try {
            savedReport = await prisma.history.create({
              data: {
                userId: mockUserId,
                ticker: ticker,
                score: decision.score,
                verdict: decision.verdict,
                reportData: JSON.parse(JSON.stringify(finalState))
              }
            });
          } catch (saveErr) {
            console.error("[Analyze API] Failed to save report:", saveErr);
          }

          sendEvent("complete", {
            reportId: savedReport?.id || "temp-report-id",
            ticker: ticker,
            verdict: decision.verdict,
            score: decision.score,
            confidence: decision.confidence,
            reportData: finalState
          });
        } else {
          throw new Error("Pipeline terminated without a final decision verdict.");
        }

      } catch (err: any) {
        console.error("[Analyze API] Pipeline execution error:", err);
        sendEvent("error", {
          message: err.message || "An unexpected error occurred during analysis."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
