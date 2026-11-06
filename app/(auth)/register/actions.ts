"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { randomUUID } from "crypto"
import { adminFromFormData, adminPatientData, adminRecordData } from "@/lib/admin-info"

export async function registerAction(formData: FormData): Promise<{ error: string } | undefined> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const firstName = (formData.get("firstName") as string)?.trim()
  const lastName = (formData.get("lastName") as string)?.trim()
  const birthDate = formData.get("birthDate") as string
  const birthCity = (formData.get("birthCity") as string)?.trim()
  const gender = (formData.get("gender") as string) || null
  const phone = (formData.get("phone") as string)?.trim() || null
  const heightRaw = formData.get("height") as string
  const weightRaw = formData.get("weight") as string
  const height = heightRaw ? parseInt(heightRaw) : null
  const weight = weightRaw ? parseFloat(weightRaw) : null
  const bloodGroup = (formData.get("bloodGroup") as string) || null
  const vaccinesUpToDate = (formData.get("vaccinesUpToDate") as string) || null
  const treatingDoctor = (formData.get("treatingDoctor") as string)?.trim() || null

  const admin = adminFromFormData(formData)

  if (!email || !password || !firstName || !lastName || !birthDate || !birthCity) {
    return { error: "Tous les champs sont obligatoires." }
  }

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Un compte avec cet email existe déjà." }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const lastPatient = await prisma.patient.findFirst({
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  })
  const nextNumber = (lastPatient?.patientNumber ?? 0) + 1

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "PATIENT",
      patient: {
        create: {
          firstName,
          lastName,
          birthDate: new Date(birthDate),
          birthCity,
          gender,
          phone,
          height,
          weight,
          bloodGroup,
          vaccinesUpToDate,
          ...adminPatientData(admin),
          patientNumber: nextNumber,
          qrCode: randomUUID(),
          record: { create: { treatingDoctor, ...adminRecordData(admin) } },
        },
      },
    },
  })

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/patient/onboarding",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé. Veuillez vous connecter." }
    }
    throw error
  }
}
