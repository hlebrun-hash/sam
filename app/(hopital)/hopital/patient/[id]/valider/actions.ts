"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

export async function validerDossierAction(
  patientId: string,
  notes: string
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.role as Role, "validate_record")) {
    return { error: "Non autorisé." }
  }

  const staffName = `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim()

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      validatedAt: new Date(),
      validatedBy: staffName,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "VALIDATE_RECORD",
      userId: session.user.id,
      patientId,
      staffId: session.user.staffId!,
      hospitalId: session.user.hospitalId!,
      details: notes || "Validation sans note",
      isEmergency: false,
    },
  })
}
