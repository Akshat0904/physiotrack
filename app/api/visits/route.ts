import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// GET /api/visits?date=2024-01-15
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  try {
    let where = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where = { visitDate: { gte: start, lte: end } };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where = { visitDate: { gte: start, lte: end } };
    }

    const visits = await prisma.visit.findMany({
      where,
      orderBy: [{ visitDate: "asc" }, { orderIndex: "asc" }],
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}

// POST /api/visits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientName, address, latitude, longitude,
      visitDate, startTime, duration, chargeAmount,
      notes, status,
    } = body;

    // Get max orderIndex for this day
    const dayStart = new Date(visitDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(visitDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.visit.findMany({
      where: { visitDate: { gte: dayStart, lte: dayEnd } },
      orderBy: { orderIndex: "desc" },
      take: 1,
    });

    const nextIndex = existing.length > 0 ? existing[0].orderIndex + 1 : 0;

    const visit = await prisma.visit.create({
      data: {
        patientName,
        address,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        visitDate: new Date(visitDate),
        startTime,
        duration: Number(duration),
        chargeAmount: Number(chargeAmount),
        notes: notes ?? null,
        status: status ?? "SCHEDULED",
        orderIndex: nextIndex,
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create visit" }, { status: 500 });
  }
}
