import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import { formatDate } from "@/lib/utils"
import IaoVerifyForm from "./IaoVerifyForm"

type Props = { params: Promise<{ id: string }> }

export default async function IaoPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.role as Role
  if (!hasPermission(role, "validate_record")) redirect(`/hopital/patient/${id}`)

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      visits: {
        include: { hospital: true },
        orderBy: { date: "desc" },
        take: 1,
      },
      record: {
        include: {
          allergies: true,
          medications: true,
          medicalHistories: true,
          emergencyContact: true,
        },
      },
    },
  })

  if (!patient) notFound()

  const latestVisit = patient.visits[0] ?? null

  let admissionDetails = null
  let existingVerified: string[] = []
  let existingCorrections: Record<string, string> = {}
  let existingNotes: { text: string; isPrivate: boolean; createdAt: string; createdBy: string }[] = []

  if (latestVisit?.admissionDetails) {
    try { admissionDetails = JSON.parse(latestVisit.admissionDetails) } catch { admissionDetails = null }
  }

  if (latestVisit?.iaoCorrections) {
    try {
      const parsed = JSON.parse(latestVisit.iaoCorrections)
      existingVerified = parsed.verifiedFields ?? []
      existingCorrections = parsed.corrections ?? {}
    } catch { /* ignore */ }
  }

  if (latestVisit?.iaoNotes) {
    try { existingNotes = JSON.parse(latestVisit.iaoNotes) } catch { existingNotes = [] }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/hopital/patient/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour au dossier
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vérification IAO</h1>
          <p className="text-sm text-gray-500">
            {patient.lastName.toUpperCase()}, {patient.firstName}
            {latestVisit && ` — Admission du ${formatDate(latestVisit.date)}`}
          </p>
        </div>
      </div>

      {/* Patient banner */}
      <div className="card bg-blue-50 border-blue-200 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg flex-shrink-0">
          {patient.firstName[0]}{patient.lastName[0]}
        </div>
        <div>
          <p className="font-bold text-blue-900">{patient.lastName.toUpperCase()}, {patient.firstName}</p>
          <p className="text-sm text-blue-700">
            Né(e) le {new Date(patient.birthDate).toLocaleDateString("fr-FR")} à {patient.birthCity}
          </p>
          {latestVisit && (
            <p className="text-xs text-blue-500 mt-0.5">
              Établissement : {latestVisit.hospital.name} · Motif déclaré : {latestVisit.reason}
            </p>
          )}
        </div>
      </div>

      <IaoVerifyForm
        visitId={latestVisit?.id ?? null}
        patientId={id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        visitReason={latestVisit?.reason ?? null}
        patientProfile={{
          bloodGroup: patient.bloodGroup,
          gender: patient.gender,
          phone: patient.phone,
          height: patient.height,
          weight: patient.weight,
          smoker: patient.smoker,
          vaccinesUpToDate: (patient as Record<string, unknown>).vaccinesUpToDate as string | null ?? null,
          allergies: patient.record?.allergies ?? [],
          medications: patient.record?.medications ?? [],
          medicalHistories: patient.record?.medicalHistories ?? [],
          emergencyContact: patient.record?.emergencyContact ?? null,
        }}
        admissionDetails={admissionDetails}
        existingVerified={existingVerified}
        existingCorrections={existingCorrections}
        iaoValidatedAt={latestVisit?.iaoValidatedAt ?? null}
        iaoValidatedBy={latestVisit?.iaoValidatedBy ?? null}
        patientValidatedAt={patient.validatedAt ?? null}
        existingNotes={existingNotes}
      />
    </div>
  )
}
