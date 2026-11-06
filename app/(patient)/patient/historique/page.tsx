import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDateTime } from "@/lib/utils"

export default async function HistoriquePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      patient: {
        include: {
          recordVersions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  })

  const patient = user?.patient
  if (!patient) redirect("/login")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique des modifications</h1>

      {patient.recordVersions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Aucune modification enregistrée</p>
          <p className="text-sm mt-1">L&apos;historique apparaîtra ici dès que vous modifierez votre dossier.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patient.recordVersions.map((v, i) => (
            <div key={v.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  Modification par {v.changedBy}
                  {i === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Dernière version</span>}
                </p>
                <p className="text-sm text-gray-500">{formatDateTime(v.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
