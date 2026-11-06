import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDate, formatBirthDate, calculateAge } from "@/lib/utils"
import Avatar from "@/components/Avatar"
import { SEVERITY_LABELS, SEVERITY_COLORS } from "@/lib/permissions"

export default async function DossierPage() {
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
              trustedPerson: true,
            },
          },
        },
      },
    },
  })

  const patient = user?.patient
  if (!patient) redirect("/login")

  const record = patient.record

  const COVERAGE: Record<string, string> = { STANDARD: "Régime général", ALD: "ALD", CMU: "CMU / C2S", AME: "AME", AUCUNE: "Aucune couverture" }
  const ID_DOC: Record<string, string> = { CNI: "Carte d'identité", PASSEPORT: "Passeport", TITRE_SEJOUR: "Titre de séjour" }
  const LEGAL: Record<string, string> = { MAJEUR: "Majeur autonome", MINEUR: "Mineur", TUTELLE: "Majeur sous tutelle" }
  const fullAddress = [patient.address, [patient.postalCode, patient.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  const adminRows: [string, string | null | undefined][] = [
    ["Nom d'usage", patient.usageName],
    ["Code lieu de naissance", patient.birthPostalCode],
    ["Adresse", fullAddress || null],
    ["Téléphone fixe", patient.landlinePhone],
    ["Pièce d'identité", patient.idDocumentType ? ID_DOC[patient.idDocumentType] : null],
    ["Employeur", patient.employer],
    ["Situation", patient.legalStatus ? LEGAL[patient.legalStatus] : null],
    ["Représentant légal", patient.legalRepName ? `${patient.legalRepName}${patient.legalRepPhone ? ` — ${patient.legalRepPhone}` : ""}` : null],
    ["Médecin traitant (tél.)", record?.treatingDoctorPhone],
    ["N° sécurité sociale", patient.socialSecurityNumber],
    ["Caisse d'assurance maladie", patient.healthFund],
    ["Couverture", patient.coverageType ? `${COVERAGE[patient.coverageType] ?? patient.coverageType}${patient.coverageEndDate ? ` — jusqu'au ${formatDate(patient.coverageEndDate)}` : ""}` : null],
    ["Mutuelle", patient.mutuelleName ? `${patient.mutuelleName}${patient.mutuelleNumber ? ` (n° ${patient.mutuelleNumber})` : ""}${patient.mutuelleEndDate ? ` — jusqu'au ${formatDate(patient.mutuelleEndDate)}` : ""}` : null],
    ["Assuré principal", patient.insuredName ? `${patient.insuredName}${patient.insuredAddress ? `, ${patient.insuredAddress}` : ""}` : null],
    ["Directives anticipées", record?.advanceDirectives === "OUI" ? "Rédigées" : record?.advanceDirectives === "NON" ? "Non rédigées" : null],
  ]
  const filledAdmin = adminRows.filter(([, v]) => !!v)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mon dossier médical</h1>
        <Link href="/patient/dossier/edit" className="btn-primary">
          Modifier
        </Link>
      </div>

      {/* Identity card */}
      <div className="card flex items-center gap-4">
        <Avatar firstName={patient.firstName} lastName={patient.lastName} photoUrl={patient.photoUrl} size="lg" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h2>
          <p className="text-gray-600">Né(e) le {formatBirthDate(patient.birthDate)} à {patient.birthCity}</p>
          <p className="text-gray-500 text-sm">{calculateAge(patient.birthDate)} ans</p>
          {patient.identityVerified && (
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
              ✓ Identité vérifiée · {patient.identityProvider ?? "État"}
            </span>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {patient.bloodGroup && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                Groupe {patient.bloodGroup}
              </span>
            )}
            {record?.treatingDoctor && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                👨‍⚕️ {record.treatingDoctor}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Informations administratives */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Informations administratives</h3>
          {filledAdmin.length < adminRows.length && (
            <Link href="/patient/dossier/edit" className="text-sm text-blue-700 hover:underline">Compléter</Link>
          )}
        </div>
        {filledAdmin.length === 0 ? (
          <p className="text-gray-500 italic">Adresse, assurance et mutuelle non renseignées — utile pour accélérer votre admission.</p>
        ) : (
          <dl className="space-y-1.5">
            {filledAdmin.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-sm border-b border-gray-100 pb-1.5">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-right font-medium text-gray-900 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Allergies */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Allergies {record?.allergies.length ? `(${record.allergies.length})` : ""}
        </h3>
        {!record?.allergies.length ? (
          <p className="text-gray-500 italic">Aucune allergie renseignée</p>
        ) : (
          <div className="space-y-2">
            {record.allergies
              .sort((a, b) => {
                const order = ["ANAPHYLAXIE", "GRAVE", "MODEREE", "LEGERE"]
                return order.indexOf(a.severity) - order.indexOf(b.severity)
              })
              .map((a) => (
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

      {/* Medications */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Traitements en cours</h3>
        {!record?.medications.length ? (
          <p className="text-gray-500 italic">Aucun traitement renseigné</p>
        ) : (
          <ul className="space-y-2">
            {record.medications.map((m) => (
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
        <h3 className="text-lg font-bold text-gray-900 mb-3">Antécédents médicaux</h3>
        {!record?.medicalHistories.length ? (
          <p className="text-gray-500 italic">Aucun antécédent renseigné</p>
        ) : (
          <ul className="space-y-2">
            {record.medicalHistories.map((h) => (
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
      {record?.emergencyContact && (
        <div className="card border-orange-200 bg-orange-50">
          <h3 className="text-lg font-bold text-orange-900 mb-3">Personne à prévenir</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-orange-900">
                {record.emergencyContact.firstName} {record.emergencyContact.lastName}
              </p>
              <p className="text-orange-700 text-sm">{record.emergencyContact.relationship}</p>
              <a href={`tel:${record.emergencyContact.phone}`} className="text-orange-800 font-semibold">
                {record.emergencyContact.phone}
              </a>
              {record.emergencyContact.email && <p className="text-orange-700 text-sm">{record.emergencyContact.email}</p>}
              {record.emergencyContact.address && <p className="text-orange-700 text-sm">{record.emergencyContact.address}</p>}
            </div>
          </div>
        </div>
      )}

      {record?.trustedPerson && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Personne de confiance</h3>
          <p className="font-semibold text-gray-900">{record.trustedPerson.firstName} {record.trustedPerson.lastName}</p>
          <p className="text-sm text-gray-600">{record.trustedPerson.relationship}</p>
          <a href={`tel:${record.trustedPerson.phone}`} className="text-blue-700 font-semibold text-sm">{record.trustedPerson.phone}</a>
          {record.trustedPerson.email && <p className="text-sm text-gray-600">{record.trustedPerson.email}</p>}
          {record.trustedPerson.address && <p className="text-sm text-gray-600">{record.trustedPerson.address}</p>}
        </div>
      )}
    </div>
  )
}
