import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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
      visitDate, endDate, startTime, duration, chargeAmount,
      notes, status,
    } = body;

    // Generate dates
    let dates = [new Date(visitDate)];
    if (endDate) {
      const end = new Date(endDate);
      if (end > dates[0]) {
        // Just generate each day by adding 1 day at a time to avoid date-fns eachDayOfInterval import overhead here
        let curr = new Date(visitDate);
        dates = [];
        while (curr <= end) {
          dates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }
      }
    }

    // Create a visit for each date
    const createdVisits = [];
    for (const d of dates) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
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
          visitDate: new Date(d),
          startTime,
          duration: Number(duration),
          chargeAmount: Number(chargeAmount),
          notes: notes ?? null,
          status: status ?? "SCHEDULED",
          orderIndex: nextIndex,
        },
      });
      createdVisits.push(visit);
    }

    return NextResponse.json(createdVisits[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create visit" }, { status: 500 });
  }
}
