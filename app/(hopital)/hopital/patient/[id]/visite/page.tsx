import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import VisiteForm from "./VisiteForm"

type Props = { params: Promise<{ id: string }> }

export default async function VisitePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!hasPermission(session.user.role as Role, "register_visit")) {
    redirect(`/hopital/patient/${id}`)
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!patient) notFound()

  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enregistrer un passage</h1>
        <p className="text-gray-500 text-sm mt-1">
          Patient : <strong>{patient.firstName} {patient.lastName}</strong>
        </p>
      </div>
      <VisiteForm
        patientId={id}
        hospitals={hospitals}
        defaultHospitalId={session.user.hospitalId}
      />
    </div>
  )
}
