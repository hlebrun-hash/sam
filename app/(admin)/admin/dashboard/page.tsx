import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user?.hospitalId) return null

  const hospitalId = session.user.hospitalId
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [hospital, totalPatients, pendingValidation, monthVisits, emergencyAccesses, hospital2] = await Promise.all([
    prisma.hospital.findUnique({ where: { id: hospitalId } }),
    prisma.patient.count(),
    prisma.patient.count({ where: { validatedAt: null } }),
    prisma.visit.count({ where: { hospitalId, date: { gte: startOfMonth } } }),
    prisma.auditLog.count({ where: { isEmergency: true, createdAt: { gte: startOfMonth } } }),
    prisma.hospital.findUnique({ where: { id: hospitalId } }),
  ])

  const monthlyPrice = hospital ? hospital.bedCount * hospital.pricePerBed : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">{hospital?.name} — {hospital?.city}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-4xl font-bold text-blue-700">{totalPatients}</div>
          <div className="text-sm text-gray-500 mt-1">Patients enregistrés</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-amber-600">{pendingValidation}</div>
          <div className="text-sm text-gray-500 mt-1">En attente validation</div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold text-green-600">{monthVisits}</div>
          <div className="text-sm text-gray-500 mt-1">Passages ce mois</div>
        </div>
        <div className="card text-center">
          <div className={`text-4xl font-bold ${emergencyAccesses > 0 ? "text-red-600" : "text-gray-400"}`}>
            {emergencyAccesses}
          </div>
          <div className="text-sm text-gray-500 mt-1">Bris de glace ce mois</div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-900">Abonnement SAM</h2>
            <p className="text-sm text-blue-700 mt-1">
              {hospital?.bedCount} lits × {hospital?.pricePerBed}€/lit/mois
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Interopérabilité avec tous les établissements partenaires incluse
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700">{monthlyPrice.toFixed(0)}€</div>
            <div className="text-sm text-blue-600">/mois HT</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/personnel" className="card flex items-center gap-4 hover:border-blue-300 transition group">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200">
            <svg className="w-7 h-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Gérer le personnel</h3>
            <p className="text-sm text-gray-500">Créer, désactiver, changer de rôle</p>
          </div>
        </Link>

        <Link href="/admin/audit" className="card flex items-center gap-4 hover:border-red-300 transition group">
          <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200">
            <svg className="w-7 h-7 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Journal d&apos;audit</h3>
            <p className="text-sm text-gray-500">
              Toutes les consultations, bris de glace en évidence
              {emergencyAccesses > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {emergencyAccesses} urgence(s)
                </span>
              )}
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
