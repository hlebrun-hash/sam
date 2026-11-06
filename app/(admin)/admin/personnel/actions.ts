"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function addStaffAction(formData: FormData): Promise<{ error: string } | undefined> {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_HOPITAL") {
    return { error: "Non autorisé." }
  }

  const hospitalId = formData.get("hospitalId") as string
  if (hospitalId !== session.user.hospitalId) {
    return { error: "Hôpital invalide." }
  }

  const firstName = (formData.get("firstName") as string).trim()
  const lastName = (formData.get("lastName") as string).trim()
  const email = (formData.get("email") as string).trim().toLowerCase()
  const role = formData.get("role") as string

  if (!firstName || !lastName || !email || !role) {
    return { error: "Tous les champs obligatoires doivent être remplis." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "Un compte avec cet email existe déjà." }

  const passwordHash = await bcrypt.hash("demo1234", 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      staff: {
        create: {
          firstName,
          lastName,
          hospitalId,
        },
      },
    },
  })
}
