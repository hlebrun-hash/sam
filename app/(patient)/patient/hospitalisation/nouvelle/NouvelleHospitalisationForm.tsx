"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { HospitalForRouting, ScoredHospital } from "@/lib/hospital-routing"

// ── Types ─────────────────────────────────────────────────────────────────────

type Allergy = { name: string; severity: string }
type Medication = { name: string; dosage: string | null; frequency: string | null }
type History = { condition: string; diagnosedAt: Date | string | null }

type PatientData = {
  id: string
  firstName: string
  lastName: string
  birthDate: Date | string
  birthCity: string
  bloodGroup: string | null
  gender: string | null
  height: number | null
  weight: number | null
  phone: string | null
  profession: string | null
  smoker: string | null
  alcoholUse: string | null
  record: {
    treatingDoctor: string | null
    allergies: Allergy[]
    medications: Medication[]
    medicalHistories: History[]
    emergencyContact: { firstName: string; lastName: string; relationship: string; phone: string } | null
  } | null
  visits: { id: string; date: Date | string; reason: string; hospital: { name: string } }[]
}

type Props = { hospitals: HospitalForRouting[]; patient: PatientData }

// ── Constants ─────────────────────────────────────────────────────────────────

const ADMISSION_TYPES = [
  {
    category: "Urgences",
    types: [
      { id: "Urgence",        icon: "🚨", desc: "Admission non planifiée aux urgences",          color: "border-red-300 bg-red-50 hover:bg-red-100",    active: "border-red-500 bg-red-100" },
      { id: "Urgence vitale", icon: "🆘", desc: "SMUR / Réanimation / Détresse vitale",           color: "border-red-400 bg-red-50 hover:bg-red-100",    active: "border-red-600 bg-red-100" },
    ],
  },
  {
    category: "Chirurgie",
    types: [
      { id: "Chirurgie programmée",   icon: "✂️",  desc: "Bloc opératoire planifié",                  color: "border-orange-200 bg-orange-50 hover:bg-orange-100", active: "border-orange-500 bg-orange-100" },
      { id: "Chirurgie ambulatoire",  icon: "🏃",  desc: "Chirurgie sans nuit d'hospitalisation",    color: "border-orange-200 bg-orange-50 hover:bg-orange-100", active: "border-orange-500 bg-orange-100" },
    ],
  },
  {
    category: "Hospitalisation médicale",
    types: [
      { id: "Hospitalisation complète",    icon: "🏥", desc: "Plusieurs nuits, suivi médical continu",  color: "border-blue-200 bg-blue-50 hover:bg-blue-100",  active: "border-blue-500 bg-blue-100" },
      { id: "Hospitalisation de jour",     icon: "☀️", desc: "Acte ou traitement en journée (HDJ)",     color: "border-blue-200 bg-blue-50 hover:bg-blue-100",  active: "border-blue-500 bg-blue-100" },
      { id: "Exploration / Bilan",         icon: "🔬", desc: "Bilan, examens ou investigations",         color: "border-blue-200 bg-blue-50 hover:bg-blue-100",  active: "border-blue-500 bg-blue-100" },
    ],
  },
  {
    category: "Obstétrique & Pédiatrie",
    types: [
      { id: "Maternité / Accouchement", icon: "👶", desc: "Accouchement ou suivi maternité",          color: "border-pink-200 bg-pink-50 hover:bg-pink-100",   active: "border-pink-500 bg-pink-100" },
      { id: "Pédiatrie",                icon: "🧒", desc: "Hospitalisation d'un enfant",               color: "border-pink-200 bg-pink-50 hover:bg-pink-100",   active: "border-pink-500 bg-pink-100" },
    ],
  },
  {
    category: "Réhabilitation & Soins de suite",
    types: [
      { id: "Rééducation / SSR",   icon: "💪", desc: "Soins de suite et réadaptation",            color: "border-green-200 bg-green-50 hover:bg-green-100", active: "border-green-500 bg-green-100" },
      { id: "Soins palliatifs",    icon: "🌿", desc: "Accompagnement et confort de vie",           color: "border-green-200 bg-green-50 hover:bg-green-100", active: "border-green-500 bg-green-100" },
    ],
  },
  {
    category: "Spécialisée",
    types: [
      { id: "Psychiatrie",    icon: "🧠", desc: "Troubles psychiatriques ou psychologiques",      color: "border-purple-200 bg-purple-50 hover:bg-purple-100", active: "border-purple-500 bg-purple-100" },
      { id: "Addictologie",   icon: "🔄", desc: "Sevrage et prise en charge addictive",           color: "border-purple-200 bg-purple-50 hover:bg-purple-100", active: "border-purple-500 bg-purple-100" },
      { id: "Oncologie",      icon: "⚕️", desc: "Chimiothérapie, immunothérapie, suivi cancer",  color: "border-purple-200 bg-purple-50 hover:bg-purple-100", active: "border-purple-500 bg-purple-100" },
    ],
  },
  {
    category: "Consultation",
    types: [
      { id: "Consultation externe", icon: "👨‍⚕️", desc: "Consultation ou examen planifié",        color: "border-gray-200 bg-gray-50 hover:bg-gray-100", active: "border-gray-500 bg-gray-100" },
    ],
  },
]

const SYMPTOM_LIST = [
  { id: "douleur-thoracique", label: "Douleur thoracique" },
  { id: "difficultes-respiratoires", label: "Difficultés respiratoires" },
  { id: "palpitations", label: "Palpitations / rythme cardiaque irrégulier" },
  { id: "douleur-abdominale", label: "Douleur abdominale" },
  { id: "nausees-vomissements", label: "Nausées / Vomissements" },
  { id: "diarrhee", label: "Diarrhée" },
  { id: "fievre", label: "Fièvre" },
  { id: "frissons", label: "Frissons" },
  { id: "maux-de-tete", label: "Maux de tête / Céphalées" },
  { id: "vertiges", label: "Vertiges / Étourdissements" },
  { id: "perte-de-conscience", label: "Perte de conscience / Syncope" },
  { id: "faiblesse-membres", label: "Faiblesse / Engourdissement des membres" },
  { id: "troubles-vision", label: "Troubles de la vision" },
  { id: "troubles-elocution", label: "Troubles de l'élocution" },
  { id: "douleur-dos", label: "Douleur dans le dos / Lombalgie" },
  { id: "douleur-articulaire", label: "Douleur articulaire" },
  { id: "plaie-trauma", label: "Plaie / Traumatisme" },
  { id: "eruption-cutanee", label: "Éruption cutanée / Urticaire" },
  { id: "oedeme", label: "Gonflement / Œdème" },
  { id: "saignement", label: "Saignement" },
  { id: "brulure-miction", label: "Brûlure à la miction" },
  { id: "fatigue-extreme", label: "Fatigue extrême" },
  { id: "perte-appetit", label: "Perte d'appétit" },
  { id: "autre", label: "Autre" },
]

const TRANSPORT_OPTIONS = [
  { id: "perso", label: "Véhicule personnel", icon: "🚗" },
  { id: "samu", label: "SAMU / 15", icon: "🚑" },
  { id: "pompiers", label: "Pompiers / 18", icon: "🚒" },
  { id: "police", label: "Police / 17", icon: "🚔" },
  { id: "pied", label: "À pied", icon: "🚶" },
  { id: "autre", label: "Autre", icon: "❓" },
]

const DURATION_OPTIONS = [
  "Moins d'une heure",
  "1 à 6 heures",
  "6 à 24 heures",
  "1 à 3 jours",
  "Plus de 3 jours",
]

const SPECIALITES = [
  "Cardiologie", "Chirurgie générale", "Chirurgie orthopédique",
  "Dermatologie", "Gastro-entérologie", "Gynécologie", "Maternité",
  "Médecine interne", "Neurologie", "Oncologie", "Ophtalmologie",
  "ORL", "Pédiatrie", "Pneumologie", "Psychiatrie", "Radiologie",
  "Rhumatologie", "Traumatologie", "Urgences", "Urologie", "Autre",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const FR_DAYS   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"]
const FR_MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]

function formatDate(d: Date | string) {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,"0")} ${FR_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

function formatTodayFR() {
  const d = new Date()
  return `${FR_DAYS[d.getDay()]} ${String(d.getDate()).padStart(2,"0")} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function genderLabel(g: string | null) {
  return g === "HOMME" ? "Masculin" : g === "FEMME" ? "Féminin" : g === "AUTRE" ? "Autre / NB" : "—"
}

function smokerLabel(s: string | null) {
  return s === "NON" ? "Non-fumeur" : s === "EX" ? "Ex-fumeur" : s === "OUI" ? "Fumeur" : "—"
}

function alcoholLabel(a: string | null) {
  return a === "JAMAIS" ? "Jamais" : a === "OCCASIONNEL" ? "Occasionnel" : a === "REGULIER" ? "Régulier" : "—"
}

// ── ReadOnly field ────────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
        {value || <span className="text-gray-400 italic">Non renseigné</span>}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NouvelleHospitalisationForm({ hospitals, patient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Section 3 — Motif
  const [typeAdmission, setTypeAdmission] = useState("")
  const [motif, setMotif] = useState("")
  const [symptomDuration, setSymptomDuration] = useState("")
  const [symptomOnset, setSymptomOnset] = useState("")

  // Section 4 — Symptômes
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [painPresent, setPainPresent] = useState(false)
  const [painScore, setPainScore] = useState(5)
  const [painLocation, setPainLocation] = useState("")
  const [feverPresent, setFeverPresent] = useState(false)
  const [temperature, setTemperature] = useState("")
  const [otherSymptoms, setOtherSymptoms] = useState("")

  // Section 5 — Contexte
  const [transportMode, setTransportMode] = useState("")
  const [previousEpisodes, setPreviousEpisodes] = useState<boolean | null>(null)
  const [contextNotes, setContextNotes] = useState("")

  // Section 6 — Établissement
  const [selectedHospital, setSelectedHospital] = useState<HospitalForRouting | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [specialite, setSpecialite] = useState("")
  const [date] = useState(new Date().toISOString().split("T")[0])
  const [medecinReferent, setMedecinReferent] = useState(patient.record?.treatingDoctor ?? "")
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [rankedHospitals, setRankedHospitals] = useState<ScoredHospital[]>([])

  function toggleSymptom(id: string) {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée. Cherchez un établissement manuellement.")
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    setSelectedHospital(null)
    setSearchQuery("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { rankHospitals } = await import("@/lib/hospital-routing")
        const ranked = rankHospitals(pos.coords.latitude, pos.coords.longitude, hospitals)
        setRankedHospitals(ranked)
        setGeoLoading(false)
      },
      () => {
        setGeoError("Position refusée. Cherchez un établissement manuellement.")
        setGeoLoading(false)
      },
      { timeout: 10000 }
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeAdmission) { setError("Veuillez sélectionner le type d'admission."); return }
    if (!motif.trim()) { setError("Le motif est obligatoire."); return }
    if (!selectedHospital) { setError("Veuillez sélectionner un établissement."); return }
    if (!symptomDuration) { setError("Veuillez indiquer la durée des symptômes."); return }
    setError(null)

    const admissionDetails = {
      typeAdmission,
      motif,
      symptoms: selectedSymptoms.map(id => SYMPTOM_LIST.find(s => s.id === id)?.label ?? id),
      painPresent,
      painScore: painPresent ? painScore : undefined,
      painLocation: painPresent ? painLocation : undefined,
      feverPresent,
      temperature: feverPresent ? temperature : undefined,
      otherSymptoms: otherSymptoms || undefined,
      symptomDuration,
      symptomOnset,
      transportMode,
      previousEpisodes,
      contextNotes: contextNotes || undefined,
      specialite: specialite || undefined,
      medecinReferent: medecinReferent || undefined,
    }

    const reason = `${typeAdmission}${specialite ? ` — ${specialite}` : ""} : ${motif}`
    const notes = medecinReferent ? `Médecin référent : ${medecinReferent}` : undefined

    startTransition(async () => {
      const res = await fetch("/api/hospitalisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: selectedHospital.id,
          date,
          reason,
          notes,
          admissionDetails,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Erreur lors de l'enregistrement.")
        return
      }
      router.push("/patient/dashboard?hospitalisation=ok")
      router.refresh()
    })
  }

  const bmi = patient.height && patient.weight
    ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── SECTION 1 : Identité (pré-remplie) ──────────────────────── */}
      <div className="card border-blue-200 bg-blue-50/40 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
          <h2 className="font-bold text-blue-900">Identité du patient</h2>
          <span className="ml-auto text-xs text-blue-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            Pré-rempli depuis votre profil
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField label="Nom" value={patient.lastName.toUpperCase()} />
          <ReadOnlyField label="Prénom" value={patient.firstName} />
          <ReadOnlyField label="Date de naissance" value={formatDate(patient.birthDate)} />
          <ReadOnlyField label="Lieu de naissance" value={patient.birthCity} />
          <ReadOnlyField label="Sexe" value={genderLabel(patient.gender)} />
          <ReadOnlyField label="Groupe sanguin" value={patient.bloodGroup ?? ""} />
          {patient.height && <ReadOnlyField label="Taille" value={`${patient.height} cm`} />}
          {patient.weight && <ReadOnlyField label="Poids" value={`${patient.weight} kg${bmi ? ` (IMC ${bmi})` : ""}`} />}
          {patient.phone && <ReadOnlyField label="Téléphone" value={patient.phone} />}
          {patient.profession && <ReadOnlyField label="Profession" value={patient.profession} />}
        </div>
        {patient.record?.emergencyContact && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <div className="text-xs text-orange-500 uppercase tracking-wide mb-1">Contact d&apos;urgence</div>
            <div className="text-sm font-medium text-orange-900">
              {patient.record.emergencyContact.firstName} {patient.record.emergencyContact.lastName}{" "}
              <span className="font-normal text-orange-700">({patient.record.emergencyContact.relationship})</span>
              {" · "}<a href={`tel:${patient.record.emergencyContact.phone}`} className="font-semibold">{patient.record.emergencyContact.phone}</a>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2 : Antécédents (pré-remplis) ───────────────────── */}
      <div className="card border-blue-200 bg-blue-50/40 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
          <h2 className="font-bold text-blue-900">Antécédents &amp; traitements</h2>
          <span className="ml-auto text-xs text-blue-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            Pré-rempli depuis votre dossier
          </span>
        </div>

        {/* Allergies */}
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Allergies connues</div>
          {!patient.record?.allergies.length ? (
            <p className="text-sm text-gray-400 italic">Aucune allergie renseignée dans votre dossier</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.record.allergies.map((a, i) => (
                <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  a.severity === "GRAVE" || a.severity === "ANAPHYLAXIE"
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-orange-100 text-orange-800 border border-orange-200"
                }`}>
                  {a.severity === "GRAVE" || a.severity === "ANAPHYLAXIE" ? "⚠ " : ""}{a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medications */}
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Traitements en cours</div>
          {!patient.record?.medications.length ? (
            <p className="text-sm text-gray-400 italic">Aucun traitement renseigné</p>
          ) : (
            <div className="space-y-1">
              {patient.record.medications.map((m, i) => (
                <div key={i} className="text-sm bg-white border border-blue-100 rounded-lg px-3 py-1.5">
                  <strong>{m.name}</strong>
                  {m.dosage && <span className="text-gray-600"> — {m.dosage}</span>}
                  {m.frequency && <span className="text-gray-400"> ({m.frequency})</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical history */}
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Antécédents médicaux</div>
          {!patient.record?.medicalHistories.length ? (
            <p className="text-sm text-gray-400 italic">Aucun antécédent renseigné</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.record.medicalHistories.map((h, i) => (
                <span key={i} className="text-xs bg-white border border-blue-100 rounded-full px-3 py-1 text-gray-700">
                  {h.condition}
                  {h.diagnosedAt && <span className="text-gray-400"> ({new Date(h.diagnosedAt).getFullYear()})</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Previous visits */}
        {patient.visits.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Hospitalisations précédentes</div>
            <div className="space-y-1">
              {patient.visits.slice(0, 3).map((v) => (
                <div key={v.id} className="text-sm bg-white border border-blue-100 rounded-lg px-3 py-1.5 flex justify-between">
                  <span className="text-gray-700">{v.reason.length > 60 ? v.reason.slice(0, 60) + "…" : v.reason}</span>
                  <span className="text-gray-400 text-xs ml-2 shrink-0">{formatDate(v.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle */}
        <div className="flex gap-3 flex-wrap">
          {patient.smoker && (
            <span className="text-xs bg-white border border-blue-100 rounded-full px-3 py-1 text-gray-600">
              🚬 {smokerLabel(patient.smoker)}
            </span>
          )}
          {patient.alcoholUse && (
            <span className="text-xs bg-white border border-blue-100 rounded-full px-3 py-1 text-gray-600">
              🍷 Alcool : {alcoholLabel(patient.alcoholUse)}
            </span>
          )}
        </div>

        <p className="text-xs text-blue-600">
          Ces informations sont incorrectes ?{" "}
          <a href="/patient/dossier/edit" className="font-semibold hover:underline">Mettre à jour votre dossier</a>
        </p>
      </div>

      {/* ── SECTION 3 : Motif de venue ───────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">3</div>
          <h2 className="font-bold text-gray-900">Motif de venue</h2>
        </div>

        <div>
          <label className="label">Type d&apos;admission *</label>
          <div className="space-y-3">
            {ADMISSION_TYPES.map(group => (
              <div key={group.category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{group.category}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.types.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeAdmission(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${
                        typeAdmission === t.id ? t.active : t.color
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{t.id}</div>
                        <div className="text-xs text-gray-400">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Motif principal *</label>
          <input
            type="text"
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Ex : Douleur thoracique intense depuis 2h, chute avec fracture probable…"
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Depuis quand ? *</label>
            <select value={symptomDuration} onChange={e => setSymptomDuration(e.target.value)} className="input-field" required>
              <option value="">— Sélectionner —</option>
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Apparition</label>
            <div className="flex gap-2 mt-1">
              {["Soudain", "Progressif"].map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setSymptomOnset(o)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                    symptomOnset === o ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {o === "Soudain" ? "⚡ Soudain" : "📈 Progressif"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4 : Symptômes ────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">4</div>
          <h2 className="font-bold text-gray-900">Symptômes actuels</h2>
          <span className="text-xs text-gray-400 ml-1">(cochez tout ce qui s&apos;applique)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SYMPTOM_LIST.map(s => (
            <label
              key={s.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                selectedSymptoms.includes(s.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-200"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSymptoms.includes(s.id)}
                onChange={() => toggleSymptom(s.id)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-800">{s.label}</span>
            </label>
          ))}
        </div>

        {/* Pain */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 flex-1">Avez-vous de la douleur ?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPainPresent(true)}
                className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition ${painPresent ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-red-300"}`}>
                Oui
              </button>
              <button type="button" onClick={() => setPainPresent(false)}
                className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition ${!painPresent ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                Non
              </button>
            </div>
          </div>

          {painPresent && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">Intensité de la douleur (EVA)</label>
                  <span className={`text-2xl font-bold ${painScore >= 8 ? "text-red-600" : painScore >= 5 ? "text-orange-500" : "text-green-600"}`}>
                    {painScore}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={painScore}
                  onChange={e => setPainScore(parseInt(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 — Pas de douleur</span>
                  <span>5 — Modérée</span>
                  <span>10 — Insupportable</span>
                </div>
              </div>
              <div>
                <label className="label">Localisation de la douleur</label>
                <input
                  type="text"
                  value={painLocation}
                  onChange={e => setPainLocation(e.target.value)}
                  placeholder="Ex : poitrine gauche, ventre bas, épaule droite…"
                  className="input-field"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fever */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-800 flex-1">Avez-vous de la fièvre ?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFeverPresent(true)}
                className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition ${feverPresent ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                Oui
              </button>
              <button type="button" onClick={() => setFeverPresent(false)}
                className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition ${!feverPresent ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-green-300"}`}>
                Non
              </button>
            </div>
          </div>
          {feverPresent && (
            <div>
              <label className="label">Température (si connue)</label>
              <input
                type="text"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                placeholder="Ex : 38,7°C"
                className="input-field"
              />
            </div>
          )}
        </div>

        <div>
          <label className="label">Autres symptômes / précisions</label>
          <textarea
            value={otherSymptoms}
            onChange={e => setOtherSymptoms(e.target.value)}
            placeholder="Décrivez tout autre symptôme ou détail important…"
            rows={2}
            className="input-field w-full resize-none"
          />
        </div>
      </div>

      {/* ── SECTION 5 : Contexte ─────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">5</div>
          <h2 className="font-bold text-gray-900">Contexte d&apos;arrivée</h2>
        </div>

        <div>
          <label className="label">Mode de transport</label>
          <div className="grid grid-cols-3 gap-2">
            {TRANSPORT_OPTIONS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTransportMode(t.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition ${
                  transportMode === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-medium text-gray-800 leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-800">Épisodes similaires antérieurs ?</label>
          <div className="flex gap-3 mt-2">
            {[{ v: true, label: "Oui" }, { v: false, label: "Non" }].map(({ v, label }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setPreviousEpisodes(v)}
                className={`px-5 py-2 rounded-lg border-2 text-sm font-medium transition ${
                  previousEpisodes === v ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes de contexte</label>
          <textarea
            value={contextNotes}
            onChange={e => setContextNotes(e.target.value)}
            placeholder="Ex : Prise récente d'un médicament, retour de voyage, contexte particulier…"
            rows={2}
            className="input-field w-full resize-none"
          />
        </div>
      </div>

      {/* ── SECTION 6 : Établissement ────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">6</div>
          <h2 className="font-bold text-gray-900">Établissement &amp; séjour</h2>
        </div>

        <div>
          <label className="label">Établissement *</label>

          {/* Option géolocalisation */}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            className={`w-full mb-3 flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${rankedHospitals.length > 0 && !selectedHospital ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
          >
            <span className="text-xl">{geoLoading ? "⌛" : "📍"}</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">{geoLoading ? "Localisation en cours…" : "Trouver un établissement près de moi"}</div>
              <div className="text-xs text-gray-400">Utiliser ma position GPS</div>
            </div>
          </button>

          {geoError && <p className="text-sm text-red-600 mb-2">{geoError}</p>}

          {rankedHospitals.length > 0 && !selectedHospital && (
            <div className="space-y-1.5 mb-3">
              {rankedHospitals.slice(0, 5).map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHospital(h)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{i === 0 ? "⭐ " : ""}{h.name}</div>
                    <div className="text-xs text-gray-500">{h.city} · <span className="font-medium text-blue-600">{h.type}</span></div>
                  </div>
                  <div className="text-sm font-bold text-blue-700 shrink-0">{h.distanceKm.toFixed(1)} km</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">ou chercher par nom</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="relative">
            <input
              type="text"
              className="input-field"
              placeholder="Tapez un nom d'établissement ou une ville…"
              value={searchQuery || selectedHospital?.name || ""}
              onChange={e => { setSearchQuery(e.target.value); setSelectedHospital(null); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && searchQuery.length >= 2 && (() => {
              const q = searchQuery.toLowerCase()
              const matches = hospitals.filter(h => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)).slice(0, 8)
              return matches.length > 0 ? (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {matches.map(h => (
                    <li key={h.id}>
                      <button type="button" onMouseDown={() => { setSelectedHospital(h); setSearchQuery(""); setShowSuggestions(false) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{h.name}</div>
                          <div className="text-xs text-gray-500">{h.city}</div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 shrink-0">{h.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                  Aucun établissement trouvé
                </div>
              )
            })()}
          </div>
          {selectedHospital && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
              <div>
                <div className="text-sm font-semibold text-blue-900">{selectedHospital.name}</div>
                <div className="text-xs text-blue-600">{selectedHospital.city} · {selectedHospital.type}{selectedHospital.phone && ` · ${selectedHospital.phone}`}</div>
              </div>
              <button type="button" onClick={() => { setSelectedHospital(null); setSearchQuery("") }} className="text-blue-400 hover:text-blue-700 text-lg">×</button>
            </div>
          )}
        </div>

        <div>
          <label className="label">Date d&apos;entrée</label>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatTodayFR()}
            <span className="text-xs text-blue-500 ml-1">(aujourd&apos;hui)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Service / Spécialité</label>
            <select value={specialite} onChange={e => setSpecialite(e.target.value)} className="input-field">
              <option value="">— Optionnel —</option>
              {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Médecin référent</label>
            <input type="text" value={medecinReferent} onChange={e => setMedecinReferent(e.target.value)}
              placeholder="Dr. Nom Prénom" className="input-field" />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? "Enregistrement…" : "Enregistrer la fiche →"}
        </button>
      </div>
    </form>
  )
}
