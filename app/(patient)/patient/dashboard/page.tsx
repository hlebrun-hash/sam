import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { missingIdentityFields } from "@/lib/franceconnect"
import Link from "next/link"
import { formatDate, formatBirthDate } from "@/lib/utils"
import Avatar from "@/components/Avatar"
import UrgenceRapideButton from "./UrgenceRapideButton"
import type { HospitalForRouting } from "@/lib/hospital-routing"

export default async function PatientDashboardPage() {
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
            },
          },
          visits: {
            include: { hospital: true },
            orderBy: { date: "desc" },
            take: 5,
          },
        },
      },
    },
  })

  const patient = user?.patient
  if (!patient) redirect("/login")

  // Identité vérifiée par l'État mais informations obligatoires manquantes : on les demande d'abord.
  if (Object.values(missingIdentityFields(user!, patient)).some(Boolean)) redirect("/patient/completer-identite")

  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, type: true, city: true, address: true, phone: true, bedCount: true, lat: true, lng: true },
    orderBy: { name: "asc" },
  }) as HospitalForRouting[]

  const severeAllergies = patient.record?.allergies.filter(
    (a) => a.severity === "GRAVE" || a.severity === "ANAPHYLAXIE"
  ) ?? []

  const profileIncomplete =
    !patient.bloodGroup ||
    (patient.record?.allergies.length === 0)

  return (
    <div className="space-y-6">
      {/* Incomplete profile banner */}
      {profileIncomplete && (
        <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🩺</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900">Profil médical incomplet</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Renseignez votre groupe sanguin, allergies, traitements et antécédents — ces informations sont essentielles en cas d&apos;urgence.
            </p>
          </div>
          <a href="/patient/onboarding"
            className="flex-shrink-0 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition whitespace-nowrap">
            Compléter →
          </a>
        </div>
      )}

      {/* Header patient */}
      <div className="card flex items-center gap-4">
        <Avatar firstName={patient.firstName} lastName={patient.lastName} photoUrl={patient.photoUrl} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-gray-600">
            Né(e) le {formatBirthDate(patient.birthDate)} à {patient.birthCity}
          </p>
          {patient.bloodGroup && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Groupe {patient.bloodGroup}
            </span>
          )}
        </div>
        {/* Validation status */}
        <div className="flex-shrink-0 text-right">
          {patient.validatedAt ? (
            <div className="alert-success flex-col items-start gap-1 text-sm">
              <span className="font-bold">✓ Dossier validé</span>
              <span className="text-xs text-green-700">
                {formatDate(patient.validatedAt)} par {patient.validatedBy}
              </span>
            </div>
          ) : (
            <div className="alert-warning flex-col items-start gap-1 text-sm">
              <span className="font-bold">⏳ En attente de validation</span>
              <span className="text-xs">L&apos;IAO vérifiera vos informations</span>
            </div>
          )}
        </div>
      </div>

      {/* Critical allergies warning */}
      {severeAllergies.length > 0 && (
        <div className="rounded-xl bg-red-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <strong className="text-lg">Allergies graves enregistrées</strong>
          </div>
          <ul className="space-y-1">
            {severeAllergies.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <span className="font-bold bg-white text-red-700 px-2 rounded text-xs uppercase mt-0.5">
                  {a.severity === "ANAPHYLAXIE" ? "ANAPHYLAXIE" : "GRAVE"}
                </span>
                <span>
                  <strong>{a.name}</strong>
                  {a.reaction && ` — ${a.reaction}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 md:col-span-4">
          <UrgenceRapideButton
            hospitals={hospitals}
            patientFirstName={patient.firstName}
            patientLastName={patient.lastName}
          />
        </div>
        <Link href="/patient/hospitalisation/nouvelle" className="card text-center hover:border-red-300 transition group col-span-2 md:col-span-4 flex items-center gap-4 justify-center py-4 border-dashed border-2">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 flex-shrink-0">
            <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Déclarer une nouvelle hospitalisation</span>
        </Link>
        <Link href="/patient/dossier/edit" className="card text-center hover:border-blue-300 transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
            <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Modifier dossier</span>
        </Link>

        <Link href="/patient/qr-code" className="card text-center hover:border-blue-300 transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200">
            <svg className="w-6 h-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Mon QR code</span>
        </Link>

        <Link href="/patient/historique" className="card text-center hover:border-blue-300 transition group">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
            <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Historique</span>
        </Link>

        <Link href="/patient/dossier" className="card text-center hover:border-blue-300 transition group">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Voir dossier</span>
        </Link>
      </div>


      {/* Recent visits */}
      {patient.visits.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Derniers passages</h2>
          <div className="space-y-3">
            {patient.visits.map((visit) => {
              let publicNotes: { text: string; createdAt: string; createdBy: string }[] = []
              if (visit.iaoNotes) {
                try {
                  const all = JSON.parse(visit.iaoNotes) as { text: string; isPrivate: boolean; createdAt: string; createdBy: string }[]
                  publicNotes = all.filter(n => !n.isPrivate)
                } catch { /* ignore */ }
              }
              return (
                <div key={visit.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{visit.hospital.name}</p>
                      <p className="text-gray-600 text-sm">{visit.reason}</p>
                      {visit.notes && <p className="text-gray-500 text-xs mt-0.5">{visit.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(visit.date)}</span>
                  </div>
                  {publicNotes.length > 0 && (
                    <div className="ml-13 space-y-1.5 pl-3 border-l-2 border-blue-200">
                      {publicNotes.map((n, i) => (
                        <div key={i} className="text-sm text-blue-900 bg-blue-50 rounded px-3 py-2">
                          <p>{n.text}</p>
                          <p className="text-xs text-blue-500 mt-0.5">{n.createdBy} · {new Date(n.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
