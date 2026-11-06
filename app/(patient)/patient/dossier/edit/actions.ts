"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { adminFromFormData, adminPatientData, adminRecordData, adminContact, adminTrusted } from "@/lib/admin-info"

export async function saveDossierAction(formData: FormData): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || session.user.role !== "PATIENT") {
    return { error: "Non autorisé." }
  }

  const patientId = formData.get("patientId") as string
  const bloodGroup = formData.get("bloodGroup") as string
  const treatingDoctor = formData.get("treatingDoctor") as string
  const heightRaw = formData.get("height") as string
  const weightRaw = formData.get("weight") as string
  const height = heightRaw ? parseInt(heightRaw) : null
  const weight = weightRaw ? parseFloat(weightRaw) : null
  const phone = (formData.get("phone") as string)?.trim() || null
  const profession = (formData.get("profession") as string)?.trim() || null
  const smoker = (formData.get("smoker") as string) || null
  const alcoholUse = (formData.get("alcoholUse") as string) || null
  const vaccinesUpToDate = (formData.get("vaccinesUpToDate") as string) || null

  // Verify ownership
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { record: { include: { allergies: true, medications: true, medicalHistories: true, emergencyContact: true, trustedPerson: true } } },
  })

  if (!patient || patient.userId !== session.user.id) {
    return { error: "Patient introuvable." }
  }

  const allergies = JSON.parse(formData.get("allergies") as string)
  const medications = JSON.parse(formData.get("medications") as string)
  const histories = JSON.parse(formData.get("histories") as string)
  const admin = adminFromFormData(formData)
  const ec = adminContact(admin)
  const tp = adminTrusted(admin)

  // Save version snapshot
  if (patient.record) {
    await prisma.recordVersion.create({
      data: {
        patientId,
        snapshot: JSON.stringify(patient.record),
        changedBy: `${patient.firstName} ${patient.lastName} (patient)`,
      },
    })
  }

  // Reset validation on modification
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      bloodGroup: bloodGroup || null,
      height,
      weight,
      phone,
      profession,
      smoker,
      alcoholUse,
      vaccinesUpToDate,
      ...adminPatientData(admin),
      validatedAt: null,
      validatedBy: null,
    },
  })

  const recordId = patient.record?.id

  if (recordId) {
    // Delete & recreate children
    await prisma.allergy.deleteMany({ where: { recordId } })
    await prisma.medication.deleteMany({ where: { recordId } })
    await prisma.medicalHistory.deleteMany({ where: { recordId } })
    await prisma.emergencyContact.deleteMany({ where: { recordId } })
    await prisma.trustedPerson.deleteMany({ where: { recordId } })

    await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        treatingDoctor: treatingDoctor || null,
        ...adminRecordData(admin),
        allergies: allergies.length > 0 ? { createMany: { data: allergies } } : undefined,
        medications: medications.length > 0 ? { createMany: { data: medications.map((m: { name: string; dosage: string; frequency: string }) => ({ name: m.name, dosage: m.dosage || null, frequency: m.frequency || null })) } } : undefined,
        medicalHistories: histories.length > 0
          ? {
              createMany: {
                data: histories.map((h: { condition: string; diagnosedAt: string }) => ({
                  condition: h.condition,
                  diagnosedAt: h.diagnosedAt ? new Date(h.diagnosedAt) : null,
                })),
              },
            }
          : undefined,
        emergencyContact: ec ? { create: ec } : undefined,
        trustedPerson: tp ? { create: tp } : undefined,
      },
    })
  }
}
