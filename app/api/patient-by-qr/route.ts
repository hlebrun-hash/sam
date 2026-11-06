import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

// Si l'utilisateur est IAO et que le patient a une hospitalisation récente
// (dans son établissement) pas encore vérifiée, on l'envoie directement sur
// la vérification IAO plutôt que sur le dossier complet.
async function resolveDestination(
  patientId: string,
  role: Role,
  hospitalId: string | null | undefined
) {
  const fallback = `/hopital/patient/${patientId}`
  if (!hasPermission(role, "validate_record")) return fallback

  const latest = await prisma.visit.findFirst({
    where: { patientId },
    orderBy: { date: "desc" },
    select: { hospitalId: true, iaoValidatedAt: true },
  })
  if (!latest || latest.iaoValidatedAt) return fallback
  if (hospitalId && latest.hospitalId !== hospitalId) return fallback

  return `${fallback}/iao`
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role as Role
  const hospitalId = session.user.hospitalId
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })

  const trimmed = code.trim()

  // Check if it's a patient number (P-XXXXX or plain number)
  const numMatch = trimmed.match(/^P?-?0*(\d+)$/i)
  if (numMatch) {
    const num = parseInt(numMatch[1])
    const patient = await prisma.patient.findUnique({
      where: { patientNumber: num },
      select: { id: true },
    })
    if (patient) return NextResponse.json({ patientId: patient.id, redirectTo: await resolveDestination(patient.id, role, hospitalId) })
  }

  // Fall back to QR code lookup
  const patient = await prisma.patient.findUnique({
    where: { qrCode: trimmed },
    select: { id: true },
  })

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ patientId: patient.id, redirectTo: await resolveDestination(patient.id, role, hospitalId) })
}
