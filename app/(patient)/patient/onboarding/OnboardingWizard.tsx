"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { submitOnboardingAction, type OnboardingData } from "./actions"
import { EntourageFields, InsuranceFields, SituationFields } from "@/components/AdminFields"
import type { AdminInfo, AdminKey } from "@/lib/admin-info"

type AllergyEntry = { name: string; severity: string; reaction: string }
type MedEntry = { name: string; dosage: string; frequency: string }
type HistoryEntry = { condition: string; diagnosedAt: string }

type Props = { initialBloodGroup?: string | null; initialAdmin: AdminInfo }

const STEP_COUNT = 7

const STEP_TITLES = [
  "Groupe sanguin & Vaccins",
  "Allergies connues",
  "Traitements en cours",
  "Antécédents médicaux",
  "Entourage & personne de confiance",
  "Assurance maladie & mutuelle",
  "Situation administrative",
]

const STEP_ICONS = ["🩸", "⚠️", "💊", "📋", "🚨", "🏥", "🪪"]

const SEVERITY_LABELS: Record<string, string> = {
  LEGERE: "Légère",
  MODEREE: "Modérée",
  GRAVE: "Grave",
  ANAPHYLAXIE: "Anaphylaxie",
}

export default function OnboardingWizard({ initialBloodGroup, initialAdmin }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Step 1
  const [bloodGroup, setBloodGroup] = useState(initialBloodGroup ?? "")
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState("")

  // Step 2 — allergies
  const [allergies, setAllergies] = useState<AllergyEntry[]>([])
  const [allergyName, setAllergyName] = useState("")
  const [allergySeverity, setAllergySeverity] = useState("MODEREE")
  const [allergyReaction, setAllergyReaction] = useState("")
  const [noAllergies, setNoAllergies] = useState(false)

  // Step 3 — medications
  const [medications, setMedications] = useState<MedEntry[]>([])
  const [medName, setMedName] = useState("")
  const [medDosage, setMedDosage] = useState("")
  const [medFrequency, setMedFrequency] = useState("")
  const [noMeds, setNoMeds] = useState(false)

  // Step 4 — histories
  const [histories, setHistories] = useState<HistoryEntry[]>([])
  const [histCondition, setHistCondition] = useState("")
  const [histYear, setHistYear] = useState("")
  const [noHistory, setNoHistory] = useState(false)

  // Steps 5-7 — administratif (entourage, assurance, situation)
  const [admin, setAdmin] = useState<AdminInfo>(initialAdmin)
  const setAdminField = (k: AdminKey, v: string) => setAdmin(prev => ({ ...prev, [k]: v }))

  function addAllergy() {
    if (!allergyName.trim()) return
    setAllergies(prev => [...prev, { name: allergyName.trim(), severity: allergySeverity, reaction: allergyReaction.trim() }])
    setAllergyName(""); setAllergyReaction("")
  }

  function addMedication() {
    if (!medName.trim()) return
    setMedications(prev => [...prev, { name: medName.trim(), dosage: medDosage.trim(), frequency: medFrequency.trim() }])
    setMedName(""); setMedDosage(""); setMedFrequency("")
  }

  function addHistory() {
    if (!histCondition.trim()) return
    setHistories(prev => [...prev, { condition: histCondition.trim(), diagnosedAt: histYear.trim() ? `${histYear}-01-01` : "" }])
    setHistCondition(""); setHistYear("")
  }

  function handleFinish() {
    const data: OnboardingData = {
      bloodGroup: bloodGroup || undefined,
      vaccinesUpToDate: vaccinesUpToDate || undefined,
      allergies,
      medications,
      histories,
      admin,
    }
    startTransition(async () => {
      await submitOnboardingAction(data)
      router.push("/patient/dashboard")
      router.refresh()
    })
  }

  function next() { if (step < STEP_COUNT) setStep(s => s + 1) }
  function skip() { if (step < STEP_COUNT) setStep(s => s + 1); else handleFinish() }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="card">
        <div className="flex gap-1 mb-3">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i + 1 <= step ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{STEP_ICONS[step - 1]}</span>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Étape {step} sur {STEP_COUNT}</p>
            <p className="font-bold text-gray-900">{STEP_TITLES[step - 1]}</p>
          </div>
        </div>
      </div>

      {/* ── Step 1: Blood group + vaccines ── */}
      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <label className="label">Groupe sanguin</label>
            <div className="grid grid-cols-4 gap-2">
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBloodGroup(g)}
                  className={`py-2.5 rounded-xl border-2 font-bold text-sm transition ${
                    bloodGroup === g ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {bloodGroup && <p className="text-xs text-gray-400 mt-1">Groupe sélectionné : <strong className="text-red-700">{bloodGroup}</strong></p>}
          </div>

          <div>
            <label className="label">Vaccins à jour ?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "OUI", label: "Oui, tous", icon: "✅" },
                { value: "PARTIEL", label: "Partiellement", icon: "⚠️" },
                { value: "NON", label: "Non / Je ne sais pas", icon: "❓" },
              ].map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVaccinesUpToDate(v.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition ${
                    vaccinesUpToDate === v.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-xl">{v.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Allergies ── */}
      {step === 2 && (
        <div className="card space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noAllergies} onChange={e => { setNoAllergies(e.target.checked); if (e.target.checked) setAllergies([]) }}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Aucune allergie connue</span>
          </label>

          {!noAllergies && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Substance allergène *</label>
                    <input value={allergyName} onChange={e => setAllergyName(e.target.value)}
                      placeholder="Ex : Pénicilline, arachides…"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAllergy() } }}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="label">Sévérité</label>
                    <select value={allergySeverity} onChange={e => setAllergySeverity(e.target.value)} className="input-field">
                      {Object.entries(SEVERITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Réaction observée (optionnel)</label>
                  <input value={allergyReaction} onChange={e => setAllergyReaction(e.target.value)}
                    placeholder="Ex : urticaire, choc anaphylactique…"
                    className="input-field" />
                </div>
                <button type="button" onClick={addAllergy} disabled={!allergyName.trim()}
                  className="btn-primary text-sm w-full">
                  + Ajouter cette allergie
                </button>
              </div>

              {allergies.length > 0 && (
                <ul className="space-y-1.5">
                  {allergies.map((a, i) => (
                    <li key={i} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-semibold text-orange-900 text-sm">{a.name}</span>
                        <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">{SEVERITY_LABELS[a.severity]}</span>
                        {a.reaction && <span className="text-xs text-orange-500 ml-1">· {a.reaction}</span>}
                      </div>
                      <button type="button" onClick={() => setAllergies(prev => prev.filter((_, j) => j !== i))}
                        className="text-orange-400 hover:text-orange-700 text-sm ml-2">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Medications ── */}
      {step === 3 && (
        <div className="card space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noMeds} onChange={e => { setNoMeds(e.target.checked); if (e.target.checked) setMedications([]) }}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Aucun traitement en cours</span>
          </label>

          {!noMeds && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div>
                  <label className="label">Nom du médicament *</label>
                  <input value={medName} onChange={e => setMedName(e.target.value)}
                    placeholder="Ex : Metformine, Doliprane…"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMedication() } }}
                    className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Dosage</label>
                    <input value={medDosage} onChange={e => setMedDosage(e.target.value)} placeholder="Ex : 500mg" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Fréquence</label>
                    <input value={medFrequency} onChange={e => setMedFrequency(e.target.value)} placeholder="Ex : 2×/jour" className="input-field" />
                  </div>
                </div>
                <button type="button" onClick={addMedication} disabled={!medName.trim()}
                  className="btn-primary text-sm w-full">
                  + Ajouter ce médicament
                </button>
              </div>

              {medications.length > 0 && (
                <ul className="space-y-1.5">
                  {medications.map((m, i) => (
                    <li key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-semibold text-blue-900 text-sm">{m.name}</span>
                        {m.dosage && <span className="ml-2 text-xs text-blue-600">{m.dosage}</span>}
                        {m.frequency && <span className="text-xs text-blue-500 ml-1">· {m.frequency}</span>}
                      </div>
                      <button type="button" onClick={() => setMedications(prev => prev.filter((_, j) => j !== i))}
                        className="text-blue-400 hover:text-blue-700 text-sm ml-2">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Medical history ── */}
      {step === 4 && (
        <div className="card space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noHistory} onChange={e => { setNoHistory(e.target.checked); if (e.target.checked) setHistories([]) }}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Aucun antécédent médical notable</span>
          </label>

          {!noHistory && (
            <>
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="label">Maladie / Opération *</label>
                    <input value={histCondition} onChange={e => setHistCondition(e.target.value)}
                      placeholder="Ex : Diabète type 2, appendicectomie…"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHistory() } }}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="label">Année</label>
                    <input value={histYear} onChange={e => setHistYear(e.target.value)}
                      type="number" min="1900" max={new Date().getFullYear()} placeholder="2018" className="input-field" />
                  </div>
                </div>
                <button type="button" onClick={addHistory} disabled={!histCondition.trim()}
                  className="btn-primary text-sm w-full">
                  + Ajouter cet antécédent
                </button>
              </div>

              {histories.length > 0 && (
                <ul className="space-y-1.5">
                  {histories.map((h, i) => (
                    <li key={i} className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-semibold text-purple-900 text-sm">{h.condition}</span>
                        {h.diagnosedAt && <span className="ml-2 text-xs text-purple-500">{new Date(h.diagnosedAt).getFullYear()}</span>}
                      </div>
                      <button type="button" onClick={() => setHistories(prev => prev.filter((_, j) => j !== i))}
                        className="text-purple-400 hover:text-purple-700 text-sm ml-2">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 5: Entourage ── */}
      {step === 5 && (
        <div className="card space-y-4">
          <p className="text-sm text-gray-500">
            Une personne à prévenir est demandée à toute admission. La personne de confiance est facultative.
          </p>
          <EntourageFields values={admin} onChange={setAdminField} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 6: Insurance ── */}
      {step === 6 && (
        <div className="card space-y-4">
          <p className="text-sm text-gray-500">
            Ces informations servent à la prise en charge de vos frais. Vous pouvez les compléter plus tard, y compris à l&apos;accueil.
          </p>
          <InsuranceFields values={admin} onChange={setAdminField} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={skip} className="btn-secondary flex-1">Passer</button>
            <button type="button" onClick={next} className="btn-primary flex-1">Continuer</button>
          </div>
        </div>
      )}

      {/* ── Step 7: Situation ── */}
      {step === 7 && (
        <div className="card space-y-4">
          <SituationFields values={admin} onChange={setAdminField} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleFinish} disabled={isPending} className="btn-secondary flex-1">
              Passer et terminer
            </button>
            <button type="button" onClick={handleFinish} disabled={isPending} className="btn-primary flex-1">
              {isPending ? "Enregistrement…" : "✓ Terminer l'inscription"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
