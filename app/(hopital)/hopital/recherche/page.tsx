import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PatientSearch from "./PatientSearch"
import type { SearchablePatient } from "@/lib/fuzzy-search"

export default async function RecherchePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      birthCity: true,
      photoUrl: true,
      bloodGroup: true,
      validatedAt: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const serialized: SearchablePatient[] = patients.map((p) => ({
    ...p,
    birthDate: p.birthDate.toISOString(),
    validatedAt: p.validatedAt ? p.validatedAt.toISOString() : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rechercher un patient</h1>
        <p className="text-gray-500 text-sm mt-1">
          Recherche floue, insensible aux accents — entrez au moins le nom ou le prénom
        </p>
      </div>
      <PatientSearch patients={serialized} role={session.user.role!} />
    </div>
  )
}
