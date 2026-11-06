import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      chiefComplaint: string
      urgencyLevel: string
      firstName?: string
      lastName?: string
      birthYear?: number
      phone?: string
      hospitalId: string
    }

    if (!body.chiefComplaint || !body.hospitalId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: body.hospitalId } })
    if (!hospital) {
      return NextResponse.json({ error: "Hôpital introuvable" }, { status: 404 })
    }

    const triage = await prisma.triageRequest.create({
      data: {
        qrCode: randomUUID(),
        chiefComplaint: body.chiefComplaint,
        urgencyLevel: body.urgencyLevel ?? "MODEREE",
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        birthYear: body.birthYear ?? null,
        phone: body.phone || null,
        hospitalId: body.hospitalId,
      },
    })

    return NextResponse.json({ id: triage.id, qrCode: triage.qrCode })
  } catch (err) {
    console.error("triage POST error:", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
