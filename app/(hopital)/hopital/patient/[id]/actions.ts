"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function brisDeGlaceAction(
  patientId: string,
  justification: string
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || session.user.role !== "URGENTISTE") {
    return { error: "Réservé aux urgentistes." }
  }
  if (!justification.trim()) {
    return { error: "La justification est obligatoire." }
  }

  const staffName = `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim()

  await prisma.auditLog.create({
    data: {
      action: "EMERGENCY_ACCESS",
      userId: session.user.id,
      patientId,
      staffId: session.user.staffId!,
      hospitalId: session.user.hospitalId!,
      details: justification,
      isEmergency: true,
    },
  })

  // Log to console for demo purposes
  console.log(`[BRIS DE GLACE] ${staffName} — patient ${patientId} — ${justification}`)
}
