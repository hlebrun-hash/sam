import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import { formatBirthDate, formatDate } from "@/lib/utils"
import { SEVERITY_LABELS, SEVERITY_COLORS } from "@/lib/permissions"
import ValiderForm from "./ValiderForm"

type Props = { params: Promise<{ id: string }> }

export default async function ValiderPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!hasPermission(session.user.role as Role, "validate_record")) {
    redirect(`/hopital/patient/${id}`)
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
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

  const sortedAllergies = [...(patient.record?.allergies ?? [])].sort((a, b) => {
    const order = ["ANAPHYLAXIE", "GRAVE", "MODEREE", "LEGERE"]
    return order.indexOf(a.severity) - order.indexOf(b.severity)
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validation du dossier</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vérifiez les informations du patient avant de valider
        </p>
      </div>

      {/* Patient summary */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-900 text-lg">
          {patient.lastName.toUpperCase()}, {patient.firstName}
        </h2>
        <p className="text-gray-600">
          Né(e) le {formatBirthDate(patient.birthDate)} à {patient.birthCity}
        </p>
        {patient.bloodGroup && (
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            Groupe {patient.bloodGroup}
          </span>
        )}
        {patient.validatedAt && (
          <p className="text-sm text-green-700">
            Dernière validation : {formatDate(patient.validatedAt)} par {patient.validatedBy}
          </p>
        )}
      </div>

      {/* Allergies to review */}
      {sortedAllergies.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">Allergies à vérifier</h3>
          <div className="space-y-2">
            {sortedAllergies.map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${SEVERITY_COLORS[a.severity]}`}>
                <span className="font-bold text-sm uppercase whitespace-nowrap">{SEVERITY_LABELS[a.severity]}</span>
                <div>
                  <span className="font-semibold">{a.name}</span>
                  {a.reaction && <span className="text-sm ml-2 opacity-80">— {a.reaction}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation form */}
      <ValiderForm patientId={id} patientName={`${patient.firstName} ${patient.lastName}`} />
    </div>
  )
}
