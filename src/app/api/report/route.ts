import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing report ID parameter." }, { status: 400 });
  }

  try {
    const record = await prisma.history.findUnique({
      where: { id }
    });

    if (!record) {
      return NextResponse.json({ error: "Analytics report not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: record.id,
      ticker: record.ticker,
      score: record.score,
      verdict: record.verdict,
      createdAt: record.createdAt,
      reportData: record.reportData
    });
  } catch (err: any) {
    console.error("[Report API] Error fetching static report:", err);
    return NextResponse.json({ error: "Failed to retrieve the report." }, { status: 500 });
  }
}
