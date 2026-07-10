import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export const dynamic = "force-dynamic";

const mockUserId = "default-user";

export async function GET() {
  try {
    const list = await prisma.history.findMany({
      where: { userId: mockUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ticker: true,
        score: true,
        verdict: true,
        createdAt: true
      }
    });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: mockUserId },
      select: { ticker: true }
    });

    const bookmarkedTickers = bookmarks.map((b: any) => b.ticker);

    return NextResponse.json({
      history: list,
      bookmarks: bookmarkedTickers
    });
  } catch (err: any) {
    console.error("[History API] Error fetching records:", err);
    return NextResponse.json(
      { error: "Failed to load historical analytics records." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, action } = body;

    if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
      return NextResponse.json({ error: "Invalid ticker format." }, { status: 400 });
    }

    if (action === "bookmark") {
      const existing = await prisma.bookmark.findFirst({
        where: { userId: mockUserId, ticker }
      });

      if (existing) {
        await prisma.bookmark.delete({
          where: { id: existing.id }
        });
        return NextResponse.json({ bookmarked: false });
      } else {
        await prisma.bookmark.create({
          data: { userId: mockUserId, ticker }
        });
        return NextResponse.json({ bookmarked: true });
      }
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Missing report ID." }, { status: 400 });

      await prisma.history.delete({
        where: { id, userId: mockUserId }
      });

      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: "Invalid action parameter." }, { status: 400 });
  } catch (err: any) {
    console.error("[History API] Error updating history:", err);
    return NextResponse.json({ error: "Action processing failed." }, { status: 500 });
  }
}
