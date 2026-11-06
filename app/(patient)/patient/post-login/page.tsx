import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { missingIdentityFields } from "@/lib/franceconnect"

// Aiguillage après connexion (notamment FranceConnect) :
// infos obligatoires manquantes -> formulaire ; profil jamais complété -> assistant ; sinon -> tableau de bord.
export default async function PostLoginPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  })
  if (!user?.patient) redirect("/login")

  const missing = missingIdentityFields(user, user.patient)
  if (Object.values(missing).some(Boolean)) redirect("/patient/completer-identite")
  if (!user.patient.onboardedAt && user.patient.identityVerified) redirect("/patient/onboarding")
  redirect("/patient/dashboard")
}
