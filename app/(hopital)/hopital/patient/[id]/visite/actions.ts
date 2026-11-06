"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

type VisiteData = {
  hospitalId: string
  reason: string
  notes: string
  date: string
}

export async function enregistrerVisiteAction(
  patientId: string,
  data: VisiteData
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.role as Role, "register_visit")) {
    return { error: "Non autorisé." }
  }
  if (!data.hospitalId || !data.reason.trim()) {
    return { error: "L'hôpital et le motif sont obligatoires." }
  }

  await prisma.visit.create({
    data: {
      patientId,
      hospitalId: data.hospitalId,
      staffId: session.user.staffId!,
      reason: data.reason,
      notes: data.notes || null,
      date: new Date(data.date),
    },
  })

  await prisma.auditLog.create({
    data: {
      action: "REGISTER_VISIT",
      userId: session.user.id,
      patientId,
      staffId: session.user.staffId!,
      hospitalId: data.hospitalId,
      details: `Passage enregistré : ${data.reason}`,
      isEmergency: false,
    },
  })
}
