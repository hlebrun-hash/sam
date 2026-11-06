import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ROLE_LABELS } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

export default async function HopitalDashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const hospitalId = session.user.hospitalId

  const [pendingCount, todayVisits] = await Promise.all([
    prisma.patient.count({ where: { validatedAt: null } }),
    hospitalId
      ? prisma.visit.count({
          where: {
            hospitalId,
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        })
      : Promise.resolve(0),
  ])

  const role = session.user.role as Role

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="card bg-blue-700 text-white">
        <h1 className="text-xl font-bold">
          Bonjour, {session.user.firstName} {session.user.lastName}
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          {ROLE_LABELS[role]} — {session.user.hospitalName}
        </p>
        <p className="text-blue-100 text-sm mt-2">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-sm text-gray-600 mt-1">Dossiers en attente de validation</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-700">{todayVisits}</div>
          <div className="text-sm text-gray-600 mt-1">Passages aujourd&apos;hui</div>
        </div>
        <div className="card text-center col-span-2 md:col-span-1">
          <div className="text-3xl font-bold text-green-600">
            <svg className="w-8 h-8 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 mt-1">Système opérationnel</div>
        </div>
      </div>

      {/* Main actions — big tablet-friendly buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/hopital/recherche" className="card flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition group">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
            <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Rechercher un patient</h2>
            <p className="text-sm text-gray-500">Par nom, prénom, date et ville de naissance</p>
          </div>
        </Link>

        <Link href="/hopital/scan" className="card flex items-center gap-4 hover:border-purple-300 hover:shadow-md transition group">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200">
            <svg className="w-8 h-8 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Scanner le QR code</h2>
            <p className="text-sm text-gray-500">Accès direct au dossier en 2 secondes</p>
          </div>
        </Link>
      </div>

      {/* Role-specific hint */}
      {role === "IAO" && pendingCount > 0 && (
        <div className="alert-warning">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>{pendingCount} dossier(s)</strong> en attente de validation IAO.
            Recherchez le patient pour valider son dossier.
          </span>
        </div>
      )}

      {role === "URGENTISTE" && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-800">Mode urgentiste</h3>
              <p className="text-sm text-red-700">
                En cas de patient inconscient, utilisez la recherche par nom + prénom puis activez
                le <strong>mode bris de glace</strong> si nécessaire.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
