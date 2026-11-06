import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DossierEditForm from "./DossierEditForm"

export default async function DossierEditPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patient: {
        include: {
          record: {
            include: {
              allergies: true,
              medications: true,
              medicalHistories: true,
              emergencyContact: true,
              trustedPerson: true,
            },
          },
        },
      },
    },
  })

  const patient = user?.patient
  if (!patient) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modifier mon dossier</h1>
        <p className="text-sm text-gray-500 mt-1">
          Toutes les modifications sont enregistrées et horodatées.
          Votre dossier devra être re-validé par l&apos;IAO.
        </p>
      </div>
      <DossierEditForm patient={patient} />
    </div>
  )
}
