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
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...body,
        visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
        chargeAmount: body.chargeAmount !== undefined ? Number(body.chargeAmount) : undefined,
      },
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
