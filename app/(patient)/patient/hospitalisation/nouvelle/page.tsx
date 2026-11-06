import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import NouvelleHospitalisationForm from "./NouvelleHospitalisationForm"
import type { HospitalForRouting } from "@/lib/hospital-routing"

export default async function NouvelleHospitalisationPage() {
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
            },
          },
          visits: {
            include: { hospital: { select: { name: true } } },
            orderBy: { date: "desc" },
            take: 5,
          },
        },
      },
    },
  })

  if (!user?.patient) redirect("/login")

  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, type: true, city: true, address: true, phone: true, bedCount: true, lat: true, lng: true },
    orderBy: { name: "asc" },
  })

  const hospitalsForRouting: HospitalForRouting[] = hospitals

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/patient/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiche d&apos;admission</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user.patient.firstName} {user.patient.lastName} — Les informations de votre dossier sont pré-remplies
          </p>
        </div>
      </div>

      <NouvelleHospitalisationForm hospitals={hospitalsForRouting} patient={user.patient} />
    </div>
  )
}
