"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { adminPatientData, adminRecordData, adminContact, adminTrusted, type AdminInfo } from "@/lib/admin-info"

type AllergyInput = { name: string; severity: string; reaction?: string }
type MedInput = { name: string; dosage?: string; frequency?: string }
type HistoryInput = { condition: string; diagnosedAt?: string }

export type OnboardingData = {
  bloodGroup?: string
  vaccinesUpToDate?: string
  allergies: AllergyInput[]
  medications: MedInput[]
  histories: HistoryInput[]
  admin: AdminInfo
}

export async function submitOnboardingAction(data: OnboardingData): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: "Non authentifié" }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: { record: true },
  })
  if (!patient) return { error: "Profil introuvable" }

  // Update patient base fields
  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      bloodGroup: data.bloodGroup || patient.bloodGroup || null,
      vaccinesUpToDate: data.vaccinesUpToDate || null,
      ...adminPatientData(data.admin),
      onboardedAt: new Date(),
    },
  })

  let recordId = patient.record?.id
  if (!recordId) {
    const newRecord = await prisma.medicalRecord.create({ data: { patientId: patient.id } })
    recordId = newRecord.id
  }

  // Allergies
  if (data.allergies.length > 0) {
    await prisma.allergy.createMany({
      data: data.allergies.map(a => ({
        recordId,
        name: a.name,
        severity: a.severity,
        reaction: a.reaction || null,
      })),
    })
  }

  // Medications
  if (data.medications.length > 0) {
    await prisma.medication.createMany({
      data: data.medications.map(m => ({
        recordId,
        name: m.name,
        dosage: m.dosage || null,
        frequency: m.frequency || null,
      })),
    })
  }

  // Medical histories
  if (data.histories.length > 0) {
    await prisma.medicalHistory.createMany({
      data: data.histories.map(h => ({
        recordId,
        condition: h.condition,
        diagnosedAt: h.diagnosedAt ? new Date(h.diagnosedAt) : null,
      })),
    })
  }

  await prisma.medicalRecord.update({ where: { id: recordId }, data: adminRecordData(data.admin) })

  // Personne à prévenir
  const ec = adminContact(data.admin)
  if (ec) {
    await prisma.emergencyContact.upsert({ where: { recordId }, create: { recordId, ...ec }, update: ec })
  }

  // Personne de confiance
  const tp = adminTrusted(data.admin)
  if (tp) {
    await prisma.trustedPerson.upsert({ where: { recordId }, create: { recordId, ...tp }, update: tp })
  }

  return {}
}
