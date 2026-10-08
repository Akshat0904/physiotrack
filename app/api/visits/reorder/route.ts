import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/visits/reorder
// Body: { ids: string[], date: string }
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    await Promise.all(
      ids.map((id: string, index: number) =>
        prisma.visit.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reorder visits" }, { status: 500 });
  }
}
