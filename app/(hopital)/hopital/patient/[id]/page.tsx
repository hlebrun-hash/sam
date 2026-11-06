import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { formatBirthDate, formatDate, calculateAge } from "@/lib/utils"
import { SEVERITY_LABELS, SEVERITY_COLORS, hasPermission } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import Avatar from "@/components/Avatar"
import BrisDeGlaceButton from "./BrisDeGlaceButton"

type Props = { params: Promise<{ id: string }> }

export default async function PatientFilePage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = session.user.role as Role
  const canViewFullRecord = hasPermission(role, "view_full_medical_record")
  const canValidate = hasPermission(role, "validate_record")
  const canRegisterVisit = hasPermission(role, "register_visit")
  const canEmergency = hasPermission(role, "emergency_access")

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      record: {
        include: {
          allergies: true,
          medications: canViewFullRecord ? true : false,
          medicalHistories: canViewFullRecord ? true : false,
          emergencyContact: canViewFullRecord ? true : false,
        },
      },
      visits: {
        include: { hospital: true },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  })

  // Parse latest admission details if present
  const latestVisit = patient?.visits[0] ?? null
  let latestAdmission: Record<string, unknown> | null = null
  if (latestVisit?.admissionDetails) {
    try { latestAdmission = JSON.parse(latestVisit.admissionDetails) } catch { /* ignore */ }
  }
  let iaoCorrections: { verifiedFields?: string[]; corrections?: Record<string, string> } = {}
  if (latestVisit?.iaoCorrections) {
    try { iaoCorrections = JSON.parse(latestVisit.iaoCorrections) } catch { /* ignore */ }
  }

  function getAdmissionValue(key: string): string {
    if (!latestAdmission) return ""
    const correction = iaoCorrections.corrections?.[key]
    return correction ?? String(latestAdmission[key] ?? "")
  }

  if (!patient) notFound()

  const severeAllergies = (patient.record?.allergies ?? []).filter(
    (a) => a.severity === "GRAVE" || a.severity === "ANAPHYLAXIE"
  )
  const sortedAllergies = [...(patient.record?.allergies ?? [])].sort((a, b) => {
    const order = ["ANAPHYLAXIE", "GRAVE", "MODEREE", "LEGERE"]
    return order.indexOf(a.severity) - order.indexOf(b.severity)
  })

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/hopital/recherche" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la recherche
      </Link>

      {/* Critical allergy banner */}
      {severeAllergies.length > 0 && (
        <div className="rounded-xl bg-red-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <strong className="text-lg">⚠ ALLERGIE(S) GRAVE(S)</strong>
          </div>
          <ul className="space-y-1">
            {severeAllergies.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <span className="font-black bg-white text-red-700 px-2 rounded text-xs uppercase mt-0.5">
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

      {/* Identity */}
      <div className="card">
        <div className="flex items-start gap-4">
          <Avatar firstName={patient.firstName} lastName={patient.lastName} photoUrl={patient.photoUrl} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.lastName.toUpperCase()}, {patient.firstName}
            </h1>
            <p className="text-gray-600">
              Né(e) le {formatBirthDate(patient.birthDate)} à {patient.birthCity}
              <span className="ml-2 text-gray-400">({calculateAge(patient.birthDate)} ans)</span>
            </p>
            {patient.bloodGroup && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Groupe {patient.bloodGroup}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 text-right space-y-2">
            {patient.validatedAt ? (
              <div className="text-xs text-green-700 font-medium">
                ✓ Validé le {formatDate(patient.validatedAt)}
                <br />
                <span className="text-green-600">par {patient.validatedBy}</span>
              </div>
            ) : (
              <div className="text-xs text-amber-600 font-medium">⏳ Non validé</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
          {canValidate && (
            <Link href={`/hopital/patient/${id}/iao`} className={`text-sm py-2 px-4 rounded-lg border-2 font-semibold transition ${
              patient.validatedAt
                ? "border-green-400 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}>
              {patient.validatedAt ? "✓ IAO — Dossier validé" : "⚠ IAO — Vérifier le dossier"}
            </Link>
          )}
          {canRegisterVisit && (
            <Link href={`/hopital/patient/${id}/visite`} className="btn-secondary text-sm py-2 px-4">
              + Enregistrer un passage
            </Link>
          )}
          {canEmergency && (
            <BrisDeGlaceButton patientId={id} patientName={`${patient.firstName} ${patient.lastName}`} />
          )}
        </div>
      </div>

      {/* Latest admission card */}
      {latestVisit && latestAdmission && (
        <div className={`card border-2 space-y-4 ${latestVisit.iaoValidatedAt ? "border-green-200" : "border-amber-200"}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">Fiche d&apos;admission actuelle</h2>
                {latestVisit.iaoValidatedAt ? (
                  <span className="text-xs bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Vérifiée IAO
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-semibold">
                    ⏳ En attente IAO
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {latestVisit.hospital.name} · {formatDate(latestVisit.date)}
              </p>
            </div>
            {canValidate && (
              <Link href={`/hopital/patient/${id}/iao`} className="btn-secondary text-sm py-1.5 px-3 shrink-0">
                {latestVisit.iaoValidatedAt ? "Revoir" : "Vérifier →"}
              </Link>
            )}
          </div>

          {/* Type + Motif */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Type</div>
              <div className="text-sm font-semibold text-gray-900">{getAdmissionValue("typeAdmission") || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Durée des symptômes</div>
              <div className="text-sm font-semibold text-gray-900">{getAdmissionValue("symptomDuration") || "—"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Motif déclaré</div>
            <div className="text-base font-bold text-gray-900">{getAdmissionValue("motif") || latestVisit.reason}</div>
          </div>

          {/* Symptoms */}
          {Array.isArray(latestAdmission.symptoms) && (latestAdmission.symptoms as string[]).length > 0 ? (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Symptômes déclarés</div>
              <div className="flex flex-wrap gap-1.5">
                {(latestAdmission.symptoms as string[]).map((s: string, i: number) => (
                  <span key={i} className="text-xs bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Pain */}
          {!!latestAdmission.painPresent && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-3">
              <span className="text-2xl font-black text-red-600">{String((latestAdmission.painScore ?? getAdmissionValue("painScore")) || "?")}/10</span>
              <div>
                <div className="text-xs text-red-500 font-semibold uppercase tracking-wide">Douleur (EVA)</div>
                {!!latestAdmission.painLocation && <div className="text-sm text-red-800">{String(latestAdmission.painLocation)}</div>}
              </div>
            </div>
          )}

          {/* Fever */}
          {!!latestAdmission.feverPresent && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-sm text-orange-800 font-medium">
              🌡 Fièvre {latestAdmission.temperature ? `— ${String(latestAdmission.temperature)}` : "déclarée"}
            </div>
          )}

          {/* Transport */}
          {!!latestAdmission.transportMode && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Transport : </span>
              {{
                perso: "Véhicule personnel", samu: "SAMU / 15", pompiers: "Pompiers / 18",
                police: "Police / 17", pied: "À pied", autre: "Autre",
              }[String(latestAdmission.transportMode)] ?? String(latestAdmission.transportMode)}
            </div>
          )}

          {/* IAO validation info */}
          {latestVisit.iaoValidatedAt && (
            <div className="text-xs text-green-600 border-t border-green-100 pt-2">
              Vérifiée le {formatDate(latestVisit.iaoValidatedAt)}
              {latestVisit.iaoValidatedBy && ` par ${latestVisit.iaoValidatedBy}`}
            </div>
          )}
        </div>
      )}

      {/* Allergies — visible to all roles */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Allergies {sortedAllergies.length > 0 ? `(${sortedAllergies.length})` : ""}
        </h2>
        {sortedAllergies.length === 0 ? (
          <p className="text-gray-400 italic text-sm">Aucune allergie renseignée</p>
        ) : (
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
        )}
      </div>

      {/* Full medical record — only for authorized roles */}
      {canViewFullRecord && patient.record && (
        <>
          {/* Medications */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Traitements en cours</h2>
            {!patient.record.medications.length ? (
              <p className="text-gray-400 italic text-sm">Aucun traitement</p>
            ) : (
              <ul className="space-y-2">
                {patient.record.medications.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{m.name}</span>
                    {m.dosage && <span className="text-gray-600 text-sm">{m.dosage}</span>}
                    {m.frequency && <span className="text-gray-500 text-sm">— {m.frequency}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Medical history */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Antécédents</h2>
            {!patient.record.medicalHistories.length ? (
              <p className="text-gray-400 italic text-sm">Aucun antécédent</p>
            ) : (
              <ul className="space-y-2">
                {patient.record.medicalHistories.map((h) => (
                  <li key={h.id} className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-900">{h.condition}</span>
                    {h.diagnosedAt && (
                      <span className="text-gray-500 text-sm ml-2">({formatDate(h.diagnosedAt)})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Emergency contact */}
          {patient.record.emergencyContact && (
            <div className="card border-orange-200 bg-orange-50">
              <h2 className="text-lg font-bold text-orange-900 mb-3">Contact d&apos;urgence</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-orange-900">
                    {patient.record.emergencyContact.firstName} {patient.record.emergencyContact.lastName}
                  </p>
                  <p className="text-orange-700 text-sm">{patient.record.emergencyContact.relationship}</p>
                  <a href={`tel:${patient.record.emergencyContact.phone}`} className="text-orange-800 font-semibold">
                    {patient.record.emergencyContact.phone}
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Visits (interoperability) */}
      {patient.visits.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Historique des passages</h2>
          <div className="space-y-2">
            {patient.visits.map((v) => (
              <div key={v.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{v.hospital.name}</p>
                  <p className="text-gray-600 text-sm">{v.reason}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(v.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
