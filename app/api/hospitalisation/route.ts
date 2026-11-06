import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  })
  if (!user?.patient) return NextResponse.json({ error: "Patient introuvable" }, { status: 404 })

  const body = await req.json()
  const { hospitalId, date, reason, notes, admissionDetails } = body

  if (!hospitalId || !date || !reason?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
  }

  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } })
  if (!hospital) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 })

  const visit = await prisma.visit.create({
    data: {
      patientId: user.patient.id,
      hospitalId,
      date: new Date(date),
      reason: reason.trim(),
      notes: notes ?? null,
      admissionDetails: admissionDetails ? JSON.stringify(admissionDetails) : null,
    },
  })

  return NextResponse.json({ id: visit.id }, { status: 201 })
}
