import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/visits/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(visit);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch visit" }, { status: 500 });
  }
}

// PATCH /api/visits/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Callers (e.g. the edit modal) round-trip the full visit they fetched,
    // which includes the nested `patient` relation object and other
    // non-scalar/derived fields. Passing those straight through to
    // prisma.visit.update() throws, since `patient` isn't a valid relation
    // write shape — so only whitelist the fields this endpoint should update.
    const {
      patientId, visitDate, endDate, startTime, duration, chargeAmount,
      notes, status, orderIndex,
      travelTimeFromPrev, travelTimeMode, travelDistanceFromPrev,
    } = body;
    void endDate; // not a Visit field; only used by POST to create a date range

    const data: Record<string, unknown> = {};
    if (patientId !== undefined) data.patientId = patientId;
    if (visitDate !== undefined) data.visitDate = new Date(visitDate);
    if (startTime !== undefined) data.startTime = startTime;
    if (duration !== undefined) data.duration = Number(duration);
    if (chargeAmount !== undefined) data.chargeAmount = Number(chargeAmount);
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;
    if (orderIndex !== undefined) data.orderIndex = orderIndex;
    if (travelTimeFromPrev !== undefined) data.travelTimeFromPrev = travelTimeFromPrev;
    if (travelTimeMode !== undefined) data.travelTimeMode = travelTimeMode;
    if (travelDistanceFromPrev !== undefined) data.travelDistanceFromPrev = travelDistanceFromPrev;

    const visit = await prisma.visit.update({
      where: { id },
      data,
      include: { patient: true },
    });
    return NextResponse.json(visit);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update visit" }, { status: 500 });
  }
}

// DELETE /api/visits/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.visit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete visit" }, { status: 500 });
  }
}
