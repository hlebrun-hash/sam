import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { missingIdentityFields } from "@/lib/franceconnect"
import Link from "next/link"
import OnboardingWizard from "./OnboardingWizard"
import { adminFromPatient } from "@/lib/admin-info"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: { include: { record: { include: { emergencyContact: true, trustedPerson: true } } } } },
  })
  if (!user?.patient) redirect("/login")

  const patient = user.patient

  // Identité vérifiée par l'État mais informations obligatoires manquantes : on les demande d'abord.
  if (Object.values(missingIdentityFields(user, patient)).some(Boolean)) redirect("/patient/completer-identite")

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complétez votre profil médical</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ces informations permettront une meilleure prise en charge en cas d&apos;urgence.
          Vous pouvez passer chaque étape et les compléter plus tard.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
        <span>👋</span>
        <span>Bienvenue, <strong>{patient.firstName}</strong> ! Votre compte est créé. Ces quelques informations aident les médecins en cas d&apos;urgence.</span>
      </div>

      <OnboardingWizard initialBloodGroup={patient.bloodGroup} initialAdmin={adminFromPatient(patient)} />

      <p className="text-center text-xs text-gray-400">
        <Link href="/patient/dashboard" className="hover:underline">Passer pour l&apos;instant — compléter depuis mon dossier</Link>
      </p>
    </div>
  )
}
