"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

export async function validateIaoAction(
  visitId: string,
  verifiedFields: string[],
  corrections: Record<string, string>
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user) return { error: "Non autorisé" }

  const role = session.user.role as Role
  if (!hasPermission(role, "validate_record")) return { error: "Rôle insuffisant — IAO uniquement" }

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } })
  const staffName = staff ? `${staff.firstName} ${staff.lastName} (IAO)` : "IAO"

  await prisma.visit.update({
    where: { id: visitId },
    data: {
      iaoValidatedAt: new Date(),
      iaoValidatedBy: staffName,
      iaoCorrections: JSON.stringify({ verifiedFields, corrections }),
    },
  })
}

export async function validateDossierAction(
  patientId: string,
  confirmNote: string
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.role as Role, "validate_record")) {
    return { error: "Non autorisé." }
  }

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } })
  const staffName = staff ? `${staff.firstName} ${staff.lastName}` : "IAO"

  await prisma.patient.update({
    where: { id: patientId },
    data: { validatedAt: new Date(), validatedBy: staffName },
  })

  await prisma.auditLog.create({
    data: {
      action: "VALIDATE_RECORD",
      userId: session.user.id,
      patientId,
      staffId: session.user.staffId!,
      hospitalId: session.user.hospitalId!,
      details: confirmNote || "Validation sans note",
      isEmergency: false,
    },
  })
}

export async function addIaoNoteAction(
  visitId: string,
  text: string,
  isPrivate: boolean
): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || !hasPermission(session.user.role as Role, "validate_record")) {
    return { error: "Non autorisé." }
  }

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } })
  const createdBy = staff ? `${staff.firstName} ${staff.lastName}` : session.user.email ?? "IAO"

  const visit = await prisma.visit.findUnique({ where: { id: visitId }, select: { iaoNotes: true } })
  if (!visit) return { error: "Passage introuvable." }

  let notes: { text: string; isPrivate: boolean; createdAt: string; createdBy: string }[] = []
  if (visit.iaoNotes) {
    try { notes = JSON.parse(visit.iaoNotes) } catch { notes = [] }
  }

  notes.push({ text, isPrivate, createdAt: new Date().toISOString(), createdBy })

  await prisma.visit.update({
    where: { id: visitId },
    data: { iaoNotes: JSON.stringify(notes) },
  })
}
