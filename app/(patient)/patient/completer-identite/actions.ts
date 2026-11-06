"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { missingIdentityFields } from "@/lib/franceconnect"

export async function completeIdentityAction(formData: FormData): Promise<{ error: string } | { ok: true }> {
  const session = await auth()
  if (!session?.user || session.user.role !== "PATIENT") return { error: "Non autorisé." }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } })
  if (!user?.patient) return { error: "Profil introuvable." }
  const missing = missingIdentityFields(user, user.patient)

  const get = (k: string) => ((formData.get(k) as string | null) ?? "").trim()
  const phone = get("phone") || null

  // L'identité certifiée par l'État (nom, prénom) n'est jamais modifiable ici :
  // on ne complète que ce que FranceConnect n'a pas fourni.
  const patientData: { birthCity?: string; gender?: string; birthDate?: Date; phone: string | null } = { phone }

  if (missing.birthCity) {
    const city = get("birthCity")
    if (!city) return { error: "Indiquez votre ville de naissance." }
    patientData.birthCity = city
  }
  if (missing.gender) {
    const gender = get("gender")
    if (!["HOMME", "FEMME", "AUTRE"].includes(gender)) return { error: "Indiquez votre sexe." }
    patientData.gender = gender
  }
  if (missing.birthDate) {
    const bd = get("birthDate")
    if (!bd || isNaN(Date.parse(bd))) return { error: "Indiquez votre date de naissance." }
    patientData.birthDate = new Date(bd)
  }

  let email: string | undefined
  if (missing.email) {
    email = get("email").toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Indiquez une adresse email valide." }
    const taken = await prisma.user.findUnique({ where: { email } })
    if (taken && taken.id !== user.id) return { error: "Cet email est déjà utilisé par un autre compte." }
  }

  await prisma.patient.update({ where: { id: user.patient.id }, data: patientData })
  if (email) await prisma.user.update({ where: { id: user.id }, data: { email } })
  return { ok: true }
}
