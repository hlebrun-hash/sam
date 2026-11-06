import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import QrCodeDisplay from "./QrCodeDisplay"

export default async function QrCodePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patient: true },
  })

  const patient = user?.patient
  if (!patient) redirect("/login")

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon QR code SAM</h1>
        <p className="text-gray-500 text-sm mt-1">
          Présentez ce code à l&apos;accueil pour un accès instantané à votre dossier
        </p>
      </div>

      <div className="card text-center">
        <div className="mb-4">
          <p className="font-bold text-lg text-gray-900">
            {patient.firstName} {patient.lastName}
          </p>
          {patient.bloodGroup && (
            <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Groupe {patient.bloodGroup}
            </span>
          )}
        </div>

        <QrCodeDisplay token={patient.qrCode} />

        {patient.patientNumber && (
          <div className="mt-2 mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Numéro patient</p>
            <p className="font-mono text-2xl font-bold text-blue-700 tracking-widest">
              P-{String(patient.patientNumber).padStart(5, "0")}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">À communiquer à l&apos;accueil si le QR code ne scanne pas</p>
          </div>
        )}

        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-mono break-all">{patient.qrCode}</p>
          <p className="text-xs text-gray-400 mt-1">Code à scanner ou saisir manuellement à l&apos;accueil</p>
        </div>
      </div>

      <div className="alert-warning">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Ce code est personnel. Ne le partagez qu&apos;avec le personnel de santé autorisé.</span>
      </div>
    </div>
  )
}
