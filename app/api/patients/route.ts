import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { visits: true }
        }
      }
    });
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const patient = await prisma.patient.create({
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone ?? null,
        notes: body.notes ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
      },
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
