"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveDossierAction } from "./actions"
import { IdentityFields, InsuranceFields, EntourageFields, SituationFields } from "@/components/AdminFields"
import { ADMIN_KEYS, adminFromPatient, type AdminKey } from "@/lib/admin-info"

type Allergy = { id?: string; name: string; severity: string; reaction: string }
type Medication = { id?: string; name: string; dosage: string; frequency: string }
type History = { id?: string; condition: string; diagnosedAt: string }

type Props = {
  patient: {
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
    vaccinesUpToDate: string | null
    [key: string]: unknown
    record: {
      id: string
      treatingDoctor: string | null
      treatingDoctorPhone?: string | null
      advanceDirectives?: string | null
      trustedPerson?: { firstName: string; lastName: string; relationship: string; phone: string; email: string | null; address: string | null } | null
      allergies: Array<{ id: string; name: string; severity: string; reaction: string | null }>
      medications: Array<{ id: string; name: string; dosage: string | null; frequency: string | null }>
      medicalHistories: Array<{ id: string; condition: string; diagnosedAt: Date | string | null }>
      emergencyContact: {
        id: string
        firstName: string
        lastName: string
        relationship: string
        phone: string
        email?: string | null
        address?: string | null
      } | null
    } | null
  }
}

const SEVERITIES = [
  { value: "LEGERE", label: "Légère" },
  { value: "MODEREE", label: "Modérée" },
  { value: "GRAVE", label: "Grave" },
  { value: "ANAPHYLAXIE", label: "Anaphylaxie" },
]

export default function DossierEditForm({ patient }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const r = patient.record

  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup ?? "")
  const [height, setHeight] = useState(patient.height?.toString() ?? "")
  const [weight, setWeight] = useState(patient.weight?.toString() ?? "")
  const [phone, setPhone] = useState(patient.phone ?? "")
  const [profession, setProfession] = useState(patient.profession ?? "")
  const [smoker, setSmoker] = useState(patient.smoker ?? "")
  const [alcoholUse, setAlcoholUse] = useState(patient.alcoholUse ?? "")
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState(patient.vaccinesUpToDate ?? "")
  const [treatingDoctor, setTreatingDoctor] = useState(r?.treatingDoctor ?? "")
  const [allergies, setAllergies] = useState<Allergy[]>(
    r?.allergies.map((a) => ({ id: a.id, name: a.name, severity: a.severity, reaction: a.reaction ?? "" })) ?? []
  )
  const [medications, setMedications] = useState<Medication[]>(
    r?.medications.map((m) => ({ id: m.id, name: m.name, dosage: m.dosage ?? "", frequency: m.frequency ?? "" })) ?? []
  )
  const [histories, setHistories] = useState<History[]>(
    r?.medicalHistories.map((h) => ({
      id: h.id,
      condition: h.condition,
      diagnosedAt: h.diagnosedAt ? new Date(h.diagnosedAt).toISOString().split("T")[0] : "",
    })) ?? []
  )
  const [admin, setAdmin] = useState(() => adminFromPatient(patient))
  const setAdminField = (k: AdminKey, v: string) => setAdmin(prev => ({ ...prev, [k]: v }))

  function addAllergy() {
    setAllergies([...allergies, { name: "", severity: "MODEREE", reaction: "" }])
  }
  function removeAllergy(i: number) {
    setAllergies(allergies.filter((_, idx) => idx !== i))
  }
  function addMed() {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }])
  }
  function removeMed(i: number) {
    setMedications(medications.filter((_, idx) => idx !== i))
  }
  function addHistory() {
    setHistories([...histories, { condition: "", diagnosedAt: "" }])
  }
  function removeHistory(i: number) {
    setHistories(histories.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData()
    formData.set("patientId", patient.id)
    formData.set("bloodGroup", bloodGroup)
    formData.set("height", height)
    formData.set("weight", weight)
    formData.set("phone", phone)
    formData.set("profession", profession)
    formData.set("smoker", smoker)
    formData.set("alcoholUse", alcoholUse)
    formData.set("vaccinesUpToDate", vaccinesUpToDate)
    formData.set("treatingDoctor", treatingDoctor)
    formData.set("allergies", JSON.stringify(allergies))
    formData.set("medications", JSON.stringify(medications))
    formData.set("histories", JSON.stringify(histories))
    for (const k of ADMIN_KEYS) formData.set(k, admin[k])

    startTransition(async () => {
      const result = await saveDossierAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/patient/dossier"), 1000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="alert-warning">{error}</div>}
      {success && <div className="alert-success">✓ Dossier sauvegardé. Redirection...</div>}

      {/* Informations générales */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">Informations générales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" className="input-field" />
          </div>
          <div>
            <label className="label">Profession</label>
            <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex : Infirmier, Comptable…" className="input-field" />
          </div>
        </div>
      </div>

      {/* Morphologie */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">Morphologie <span className="text-xs font-normal text-gray-400 ml-1">— pour le calcul des dosages</span></h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Taille (cm)</label>
            <input type="number" min="50" max="250" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="input-field" />
          </div>
          <div>
            <label className="label">Poids (kg)</label>
            <input type="number" min="1" max="400" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="input-field" />
          </div>
        </div>
        {height && weight && (
          <p className="text-sm text-gray-500">
            IMC estimé : <strong className="text-gray-800">{(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}</strong>
          </p>
        )}
      </div>

      {/* Mode de vie */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">Mode de vie</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tabac</label>
            <select value={smoker} onChange={(e) => setSmoker(e.target.value)} className="input-field">
              <option value="">Non renseigné</option>
              <option value="NON">Non-fumeur</option>
              <option value="EX">Ex-fumeur</option>
              <option value="OUI">Fumeur</option>
            </select>
          </div>
          <div>
            <label className="label">Alcool</label>
            <select value={alcoholUse} onChange={(e) => setAlcoholUse(e.target.value)} className="input-field">
              <option value="">Non renseigné</option>
              <option value="JAMAIS">Jamais</option>
              <option value="OCCASIONNEL">Occasionnel</option>
              <option value="REGULIER">Régulier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blood group + treating doctor */}
      <div className="card space-y-4">
        <h3 className="font-bold text-gray-900">Suivi médical</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Groupe sanguin</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="input-field">
              <option value="">Non renseigné</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Médecin traitant</label>
            <input type="text" value={treatingDoctor} onChange={(e) => setTreatingDoctor(e.target.value)} placeholder="Dr. Nom Prénom" className="input-field" />
          </div>
        </div>
        <div>
          <label className="label">Vaccins à jour ?</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "OUI", label: "Oui, tous", icon: "✅" },
              { value: "PARTIEL", label: "Partiellement", icon: "⚠️" },
              { value: "NON", label: "Non / Je ne sais pas", icon: "❓" },
            ].map(v => (
              <button key={v.value} type="button" onClick={() => setVaccinesUpToDate(v.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition ${
                  vaccinesUpToDate === v.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}>
                <span className="text-xl">{v.icon}</span>
                <span className="text-xs font-medium text-gray-700">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Allergies</h3>
          <button type="button" onClick={addAllergy} className="btn-secondary text-sm py-2 px-4">+ Ajouter</button>
        </div>
        {allergies.map((a, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Allergène"
              value={a.name}
              onChange={(e) => { const n = [...allergies]; n[i].name = e.target.value; setAllergies(n) }}
              className="input-field col-span-4"
              required
            />
            <select
              value={a.severity}
              onChange={(e) => { const n = [...allergies]; n[i].severity = e.target.value; setAllergies(n) }}
              className="input-field col-span-3"
            >
              {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Réaction (optionnel)"
              value={a.reaction}
              onChange={(e) => { const n = [...allergies]; n[i].reaction = e.target.value; setAllergies(n) }}
              className="input-field col-span-4"
            />
            <button type="button" onClick={() => removeAllergy(i)} className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg">✕</button>
          </div>
        ))}
        {allergies.length === 0 && <p className="text-gray-400 text-sm italic">Aucune allergie</p>}
      </div>

      {/* Medications */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Traitements en cours</h3>
          <button type="button" onClick={addMed} className="btn-secondary text-sm py-2 px-4">+ Ajouter</button>
        </div>
        {medications.map((m, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
            <input type="text" placeholder="Médicament" value={m.name} onChange={(e) => { const n = [...medications]; n[i].name = e.target.value; setMedications(n) }} className="input-field col-span-4" required />
            <input type="text" placeholder="Dosage" value={m.dosage} onChange={(e) => { const n = [...medications]; n[i].dosage = e.target.value; setMedications(n) }} className="input-field col-span-4" />
            <input type="text" placeholder="Fréquence" value={m.frequency} onChange={(e) => { const n = [...medications]; n[i].frequency = e.target.value; setMedications(n) }} className="input-field col-span-3" />
            <button type="button" onClick={() => removeMed(i)} className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg">✕</button>
          </div>
        ))}
        {medications.length === 0 && <p className="text-gray-400 text-sm italic">Aucun traitement</p>}
      </div>

      {/* Medical history */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Antécédents médicaux</h3>
          <button type="button" onClick={addHistory} className="btn-secondary text-sm py-2 px-4">+ Ajouter</button>
        </div>
        {histories.map((h, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
            <input type="text" placeholder="Pathologie / condition" value={h.condition} onChange={(e) => { const n = [...histories]; n[i].condition = e.target.value; setHistories(n) }} className="input-field col-span-7" required />
            <input type="date" value={h.diagnosedAt} onChange={(e) => { const n = [...histories]; n[i].diagnosedAt = e.target.value; setHistories(n) }} className="input-field col-span-4" />
            <button type="button" onClick={() => removeHistory(i)} className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg">✕</button>
          </div>
        ))}
        {histories.length === 0 && <p className="text-gray-400 text-sm italic">Aucun antécédent</p>}
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-gray-900">Identité &amp; adresse</h3>
        <IdentityFields values={admin} onChange={setAdminField} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-gray-900">Assurance maladie &amp; mutuelle</h3>
        <InsuranceFields values={admin} onChange={setAdminField} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-gray-900">Entourage &amp; directives</h3>
        <EntourageFields values={admin} onChange={setAdminField} />
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-gray-900">Situation administrative</h3>
        <SituationFields values={admin} onChange={setAdminField} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? "Sauvegarde en cours..." : "Sauvegarder le dossier"}
        </button>
        <a href="/patient/dossier" className="btn-secondary">Annuler</a>
      </div>
    </form>
  )
}
