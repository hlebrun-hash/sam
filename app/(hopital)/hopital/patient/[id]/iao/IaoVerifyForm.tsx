"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { validateIaoAction, validateDossierAction, addIaoNoteAction } from "./actions"

type AdmissionDetails = {
  typeAdmission?: string
  motif?: string
  symptoms?: string[]
  painPresent?: boolean
  painScore?: number
  painLocation?: string
  feverPresent?: boolean
  temperature?: string
  otherSymptoms?: string
  symptomDuration?: string
  symptomOnset?: string
  transportMode?: string
  previousEpisodes?: boolean
  contextNotes?: string
  specialite?: string
  medecinReferent?: string
}

type Allergy = { name: string; severity: string; reaction?: string | null }
type Medication = { name: string; dosage?: string | null; frequency?: string | null }
type MedicalHistory = { condition: string; diagnosedAt?: Date | string | null }
type EmergencyContact = { firstName: string; lastName: string; relationship: string; phone: string }

type PatientProfile = {
  bloodGroup?: string | null
  gender?: string | null
  phone?: string | null
  height?: number | null
  weight?: number | null
  smoker?: string | null
  vaccinesUpToDate?: string | null
  allergies: Allergy[]
  medications: Medication[]
  medicalHistories: MedicalHistory[]
  emergencyContact?: EmergencyContact | null
}

type FieldItem = {
  key: string
  label: string
  value: string
  important?: boolean
  section: "profile" | "admission"
}

type IaoNote = { text: string; isPrivate: boolean; createdAt: string; createdBy: string }

type Props = {
  visitId: string | null
  patientId: string
  patientName: string
  visitReason?: string | null
  patientProfile: PatientProfile
  admissionDetails: AdmissionDetails | null
  existingVerified?: string[]
  existingCorrections?: Record<string, string>
  iaoValidatedAt?: Date | null
  iaoValidatedBy?: string | null
  patientValidatedAt?: Date | null
  existingNotes?: IaoNote[]
}

function transportLabel(t?: string) {
  const map: Record<string, string> = {
    perso: "Véhicule personnel", samu: "SAMU / 15", pompiers: "Pompiers / 18",
    police: "Police / 17", pied: "À pied", autre: "Autre",
  }
  return t ? (map[t] ?? t) : "—"
}

function severityLabel(s: string) {
  const m: Record<string, string> = { LEGERE: "Légère", MODEREE: "Modérée", GRAVE: "Grave", ANAPHYLAXIE: "Anaphylaxie" }
  return m[s] ?? s
}

function genderLabel(g?: string | null) {
  if (g === "HOMME") return "Homme"
  if (g === "FEMME") return "Femme"
  if (g === "AUTRE") return "Autre / NB"
  return "—"
}

function smokerLabel(s?: string | null) {
  if (s === "NON") return "Non-fumeur"
  if (s === "EX") return "Ex-fumeur"
  if (s === "OUI") return "Fumeur"
  return "—"
}

function vaccineLabel(v?: string | null) {
  if (v === "OUI") return "Oui, tous à jour"
  if (v === "PARTIEL") return "Partiellement à jour"
  if (v === "NON") return "Non / Inconnu"
  return "—"
}

export default function IaoVerifyForm({
  visitId, patientId, patientName, visitReason, patientProfile, admissionDetails,
  existingVerified = [], existingCorrections = {},
  iaoValidatedAt, iaoValidatedBy,
  patientValidatedAt, existingNotes = [],
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Validation dossier
  const [confirmNote, setConfirmNote] = useState("")
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [dossierValidated, setDossierValidated] = useState(!!patientValidatedAt)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isPendingValidation, startValidationTransition] = useTransition()

  // Notes
  const [notes, setNotes] = useState<IaoNote[]>(existingNotes)
  const [noteText, setNoteText] = useState("")
  const [notePrivate, setNotePrivate] = useState(true)
  const [isPendingNote, startNoteTransition] = useTransition()
  const [noteError, setNoteError] = useState<string | null>(null)

  const [verified, setVerified] = useState<Record<string, boolean>>(
    Object.fromEntries(existingVerified.map(k => [k, true]))
  )
  const [corrections, setCorrections] = useState<Record<string, string>>(existingCorrections)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Build profile fields
  const p = patientProfile
  const profileFields: FieldItem[] = [
    { key: "p_bloodGroup",   label: "Groupe sanguin",    value: p.bloodGroup ?? "—", important: true,  section: "profile" },
    { key: "p_gender",       label: "Sexe",              value: genderLabel(p.gender),                  section: "profile" },
    { key: "p_phone",        label: "Téléphone",         value: p.phone ?? "—",                         section: "profile" },
    {
      key: "p_morpho",
      label: "Taille / Poids",
      value: p.height && p.weight
        ? `${p.height} cm · ${p.weight} kg`
        : p.height ? `${p.height} cm` : p.weight ? `${p.weight} kg` : "—",
      section: "profile",
    },
    { key: "p_smoker",       label: "Tabac",             value: smokerLabel(p.smoker),                  section: "profile" },
    { key: "p_vaccines",     label: "Vaccins à jour",    value: vaccineLabel(p.vaccinesUpToDate),        section: "profile" },
    {
      key: "p_allergies",
      label: "Allergies",
      value: p.allergies.length > 0
        ? p.allergies.map(a => `${a.name} (${severityLabel(a.severity)})`).join(", ")
        : "Aucune allergie déclarée",
      important: true,
      section: "profile",
    },
    {
      key: "p_medications",
      label: "Traitements en cours",
      value: p.medications.length > 0
        ? p.medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` (${m.frequency})` : ""}`).join(", ")
        : "Aucun traitement",
      important: true,
      section: "profile",
    },
    {
      key: "p_histories",
      label: "Antécédents médicaux",
      value: p.medicalHistories.length > 0
        ? p.medicalHistories.map(h => h.condition).join(", ")
        : "Aucun antécédent",
      section: "profile",
    },
    {
      key: "p_emergency",
      label: "Contact d'urgence",
      value: p.emergencyContact
        ? `${p.emergencyContact.firstName} ${p.emergencyContact.lastName} (${p.emergencyContact.relationship}) — ${p.emergencyContact.phone}`
        : "—",
      section: "profile",
    },
  ]

  // Build admission fields (only if admissionDetails exists)
  const ad = admissionDetails
  const admissionFields: FieldItem[] = ad ? [
    { key: "typeAdmission",    label: "Type d'admission",     value: ad.typeAdmission ?? "—",   important: true, section: "admission" },
    { key: "motif",            label: "Motif principal",      value: ad.motif ?? "—",           important: true, section: "admission" },
    { key: "symptomDuration",  label: "Durée des symptômes",  value: ad.symptomDuration ?? "—",                  section: "admission" },
    { key: "symptomOnset",     label: "Apparition",           value: ad.symptomOnset ?? "—",                     section: "admission" },
    {
      key: "symptoms",
      label: "Symptômes déclarés",
      value: ad.symptoms?.length ? ad.symptoms.join(", ") : "Aucun coché",
      important: true,
      section: "admission",
    },
    {
      key: "pain",
      label: "Douleur",
      value: ad.painPresent
        ? `Oui — ${ad.painScore ?? "?"}/10${ad.painLocation ? `, localisation : ${ad.painLocation}` : ""}`
        : "Non",
      important: true,
      section: "admission",
    },
    {
      key: "fever",
      label: "Fièvre",
      value: ad.feverPresent ? `Oui${ad.temperature ? ` — ${ad.temperature}` : ""}` : "Non",
      section: "admission",
    },
    { key: "otherSymptoms",   label: "Autres symptômes",     value: ad.otherSymptoms ?? "Aucun",    section: "admission" },
    { key: "transportMode",   label: "Mode de transport",    value: transportLabel(ad.transportMode), section: "admission" },
    {
      key: "previousEpisodes",
      label: "Épisodes antérieurs",
      value: ad.previousEpisodes === true ? "Oui" : ad.previousEpisodes === false ? "Non" : "—",
      section: "admission",
    },
    { key: "contextNotes",    label: "Notes de contexte",    value: ad.contextNotes ?? "Aucune",  section: "admission" },
    { key: "specialite",      label: "Service / Spécialité", value: ad.specialite ?? "—",         section: "admission" },
    { key: "medecinReferent", label: "Médecin référent",     value: ad.medecinReferent ?? "—",    section: "admission" },
  ] : visitReason ? [
    { key: "motif", label: "Motif de venue", value: visitReason, important: true, section: "admission" },
  ] : []

  // Le patient est déjà connecté et son profil renseigné : l'IAO ne vérifie que le motif de venue.
  // Le profil reste affiché en lecture seule (allergies, traitements…) comme repère de sécurité.
  const allFields = admissionFields
  const visibleFields = admissionFields

  function getDisplayValue(field: FieldItem) {
    return corrections[field.key] ?? field.value
  }

  function handleVerify(key: string) {
    setVerified(prev => ({ ...prev, [key]: true }))
  }

  function startEdit(field: FieldItem) {
    setEditing(field.key)
    setEditValue(corrections[field.key] ?? field.value)
  }

  function saveEdit(key: string) {
    if (editValue.trim()) {
      setCorrections(prev => ({ ...prev, [key]: editValue.trim() }))
      setVerified(prev => ({ ...prev, [key]: true }))
    }
    setEditing(null)
  }

  function handleFinish() {
    setError(null)
    if (!visitId) {
      router.push(`/hopital/patient/${patientId}`)
      return
    }
    const verifiedKeys = Object.keys(verified).filter(k => verified[k])
    startTransition(async () => {
      const result = await validateIaoAction(visitId, verifiedKeys, corrections)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleValidateDossier() {
    if (!confirmChecked) { setValidationError("Cochez la case de confirmation."); return }
    setValidationError(null)
    startValidationTransition(async () => {
      const result = await validateDossierAction(patientId, confirmNote)
      if (result?.error) { setValidationError(result.error) }
      else { setDossierValidated(true); setConfirmNote(""); setConfirmChecked(false) }
    })
  }

  function handleAddNote() {
    if (!noteText.trim()) return
    if (!visitId) { setNoteError("Pas de passage actif — impossible d'ajouter une note."); return }
    setNoteError(null)
    startNoteTransition(async () => {
      const result = await addIaoNoteAction(visitId, noteText.trim(), notePrivate)
      if (result?.error) { setNoteError(result.error) }
      else {
        const now = new Date().toISOString()
        setNotes(prev => [...prev, { text: noteText.trim(), isPrivate: notePrivate, createdAt: now, createdBy: "Moi" }])
        setNoteText("")
      }
    })
  }

  const totalVisible = visibleFields.length
  const verifiedVisible = visibleFields.filter(f => !!verified[f.key]).length
  const allVerifiedGlobal = allFields.every(f => !!verified[f.key])

  return (
    <div className="space-y-4">

      {iaoValidatedAt && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ Fiche déjà vérifiée le <span suppressHydrationWarning>{new Date(iaoValidatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          {iaoValidatedBy && ` par ${iaoValidatedBy}`}
        </div>
      )}

      {/* Motif de venue : seul élément à vérifier */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-900">
        <strong>À vérifier avec le patient :</strong> la raison de sa venue. Constatez par vous-même (ex. la plaie, la douleur),
        puis validez ce qu&apos;il a déclaré ou corrigez si la situation est plus (ou moins) importante.
      </div>

      {admissionFields.length === 0 && (
        <div className="card text-center py-6">
          <p className="text-gray-500 text-sm">Aucun motif de venue déclaré pour ce passage.</p>
        </div>
      )}

      {/* Progress for current section */}
      {totalVisible > 0 && (
        <div className="card py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800">Éléments vérifiés</span>
            <span className="text-sm font-bold text-blue-700">{verifiedVisible} / {totalVisible}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(verifiedVisible / totalVisible) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Examinez le patient, puis validez ou corrigez ce qu&apos;il a déclaré.
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-2">
        {visibleFields.map((field) => {
          const isVerified = !!verified[field.key]
          const isCorrected = !!corrections[field.key]
          const displayValue = getDisplayValue(field)

          return (
            <div
              key={field.key}
              className={`rounded-xl border p-4 transition ${
                isVerified
                  ? isCorrected
                    ? "border-amber-300 bg-amber-50"
                    : "border-green-300 bg-green-50"
                  : field.important
                  ? "border-orange-200 bg-orange-50/40"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{field.label}</span>
                    {field.important && !isVerified && (
                      <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-medium">Important</span>
                    )}
                    {isVerified && !isCorrected && (
                      <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-medium">✓ Validé</span>
                    )}
                    {isCorrected && (
                      <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">✎ Corrigé</span>
                    )}
                  </div>

                  {editing === field.key ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(field.key); if (e.key === "Escape") setEditing(null) }}
                        className="input-field flex-1 text-sm py-1.5"
                        autoFocus
                      />
                      <button type="button" onClick={() => saveEdit(field.key)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                        ✓
                      </button>
                      <button type="button" onClick={() => setEditing(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 break-words">
                      {isCorrected ? (
                        <>
                          <span className="line-through text-gray-400 text-xs mr-2">{field.value}</span>
                          <span className="text-amber-800 font-semibold">{displayValue}</span>
                        </>
                      ) : displayValue}
                    </div>
                  )}
                </div>

                {editing !== field.key && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => handleVerify(field.key)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                      >
                        ✓ Validé
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(field)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                    >
                      ✎ Corriger
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Finish verification */}
      <div className="card bg-gray-50 space-y-3">
        {!allVerifiedGlobal && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ Certains champs ne sont pas encore vérifiés. Vous pouvez terminer quand même.
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/hopital/patient/${patientId}`)}
            className="btn-secondary flex-1"
          >
            Revenir au dossier
          </button>
          <button
            type="button"
            onClick={handleFinish}
            disabled={isPending || !visitId}
            className="btn-primary flex-1"
          >
            {isPending ? "Enregistrement…" : allVerifiedGlobal ? "✓ Tout vérifié — Terminer" : "Terminer la vérification"}
          </button>
        </div>
        {!visitId && (
          <p className="text-xs text-gray-400 text-center">Pas de visite active — les corrections ne seront pas sauvegardées.</p>
        )}
      </div>

      {/* ── Profil patient (lecture seule) ── */}
      <details className="card">
        <summary className="cursor-pointer font-semibold text-gray-800 text-sm">
          🧑‍⚕️ Profil patient (déjà renseigné — lecture seule)
        </summary>
        <dl className="mt-3 space-y-2">
          {profileFields.map(f => (
            <div key={f.key} className="flex justify-between gap-4 text-sm border-b border-gray-100 pb-1.5">
              <dt className="text-gray-500">{f.label}</dt>
              <dd className={`text-right font-medium break-words ${f.important ? "text-gray-900" : "text-gray-700"}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </details>

      {/* ── Notes de passage ── */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span>📝</span> Notes de passage
        </h3>

        {/* Existing notes */}
        {notes.length > 0 && (
          <div className="space-y-2">
            {notes.map((n, i) => (
              <div key={i} className={`rounded-lg p-3 text-sm border ${n.isPrivate ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n.isPrivate ? "bg-gray-200 text-gray-700" : "bg-blue-200 text-blue-800"}`}>
                    {n.isPrivate ? "🔒 Privé" : "👁 Visible patient"}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} — {n.createdBy}</span>
                </div>
                <p className="text-gray-800">{n.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add note */}
        <div className="space-y-3">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Ajouter une observation, une instruction, un commentaire…"
            rows={3}
            className="input-field w-full resize-none text-sm"
          />
          <div className="flex items-center gap-3">
            {/* Toggle privé / public */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm flex-1">
              <button
                type="button"
                onClick={() => setNotePrivate(true)}
                className={`flex-1 py-2 px-3 font-medium transition ${notePrivate ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                🔒 Privé
              </button>
              <button
                type="button"
                onClick={() => setNotePrivate(false)}
                className={`flex-1 py-2 px-3 font-medium transition ${!notePrivate ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                👁 Visible patient
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddNote}
              disabled={isPendingNote || !noteText.trim()}
              className="btn-primary py-2 px-4 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {isPendingNote ? "…" : "Ajouter"}
            </button>
          </div>
          {noteError && <p className="text-sm text-red-600">{noteError}</p>}
          <p className="text-xs text-gray-400">
            <strong>Privé</strong> : visible uniquement par le personnel hospitalier. <strong>Visible patient</strong> : affiché dans le dossier du patient.
          </p>
        </div>
      </div>

      {/* ── Validation du dossier ── */}
      <div className={`card space-y-4 border-2 ${dossierValidated ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span>✅</span> Validation du dossier
        </h3>

        {dossierValidated ? (
          <div className="text-sm text-green-800 font-medium">
            ✓ Dossier validé — {patientName}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={confirmNote}
              onChange={e => setConfirmNote(e.target.value)}
              placeholder="Remarques de validation (optionnel)…"
              rows={2}
              className="input-field w-full resize-none text-sm"
            />
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={e => setConfirmChecked(e.target.checked)}
                className="mt-1 w-5 h-5 rounded accent-blue-700 shrink-0"
              />
              <span className="text-sm text-gray-700">
                Je certifie avoir vérifié l&apos;identité de <strong>{patientName}</strong> et l&apos;exactitude du motif de venue.
              </span>
            </label>
            {validationError && <p className="text-sm text-red-600">{validationError}</p>}
            <button
              type="button"
              onClick={handleValidateDossier}
              disabled={isPendingValidation}
              className="btn-primary w-full"
            >
              {isPendingValidation ? "Validation en cours…" : "✓ Valider le dossier"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
