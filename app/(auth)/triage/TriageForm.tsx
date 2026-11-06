"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import type { HospitalForRouting, ScoredHospital } from "@/lib/hospital-routing"
import { getAffluenceScore } from "@/lib/hospital-routing"

type Props = { hospitals: HospitalForRouting[] }

const COMPLAINTS = [
  { id: "Hémorragie",          icon: "🩸", sub: "Saignement important",    urgency: "CRITIQUE" },
  { id: "Douleur thoracique",  icon: "❤️", sub: "Cardiaque, infarctus",    urgency: "CRITIQUE" },
  { id: "Difficultés respiratoires", icon: "🫁", sub: "Souffle, asphyxie", urgency: "CRITIQUE" },
  { id: "Perte de conscience", icon: "🧠", sub: "AVC, syncope",            urgency: "CRITIQUE" },
  { id: "Fracture",            icon: "🦴", sub: "Os cassé, traumatisme",   urgency: "HAUTE" },
  { id: "Brûlure",             icon: "🔥", sub: "Chaleur, produit chimique",urgency: "HAUTE" },
  { id: "Douleur intense",     icon: "🤕", sub: "Niveau élevé",            urgency: "HAUTE" },
  { id: "Douleur abdominale",  icon: "🤢", sub: "Ventre, nausées",         urgency: "MODEREE" },
  { id: "Fièvre",              icon: "🌡️", sub: "Température élevée",     urgency: "MODEREE" },
  { id: "Plaie",               icon: "🩹", sub: "Coupure, blessure",       urgency: "MODEREE" },
  { id: "Autre",               icon: "✳️", sub: "Autre problème",         urgency: "MODEREE" },
]

const URGENCY_COLORS: Record<string, string> = {
  CRITIQUE: "border-red-500 bg-red-50 hover:bg-red-100",
  HAUTE:    "border-orange-400 bg-orange-50 hover:bg-orange-100",
  MODEREE:  "border-amber-300 bg-amber-50 hover:bg-amber-100",
}
const URGENCY_BADGE: Record<string, string> = {
  CRITIQUE: "bg-red-600 text-white",
  HAUTE:    "bg-orange-500 text-white",
  MODEREE:  "bg-amber-400 text-white",
}
const URGENCY_LABEL: Record<string, string> = {
  CRITIQUE: "Critique — prioritaire",
  HAUTE:    "Haute priorité",
  MODEREE:  "Urgence modérée",
}

// ── Barre d'affluence ────────────────────────────────────────────────────────

function AffluenceBar({ score }: { score: number }) {
  const isHigh = score >= 75
  const isMid  = score >= 45
  const color  = isHigh ? "bg-red-500" : isMid ? "bg-orange-400" : "bg-green-500"
  const label  = isHigh ? "Très chargé" : isMid ? "Chargé" : "Disponible"
  const tc     = isHigh ? "text-red-600" : isMid ? "text-orange-500" : "text-green-600"
  return (
    <div className="mt-1.5">
      <div className="flex justify-between items-center mb-0.5">
        <span className={`text-xs font-semibold ${tc}`}>{label}</span>
        <span className={`text-xs font-bold ${tc}`}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full" style={{ height: 6 }}>
        <div
          className={`${color} rounded-full`}
          style={{ height: 6, width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function TriageForm({ hospitals }: Props) {
  const [step, setStep] = useState(1)
  const [complaint, setComplaint] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState("MODEREE")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [phone, setPhone] = useState("")
  const [locType, setLocType] = useState<"here" | "geo" | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<HospitalForRouting | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [rankedHospitals, setRankedHospitals] = useState<ScoredHospital[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [triageId, setTriageId] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  function selectComplaint(c: typeof COMPLAINTS[0]) {
    setComplaint(c.id)
    setUrgencyLevel(c.urgency)
    setStep(2)
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée. Sélectionnez un centre manuellement.")
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { rankHospitals } = await import("@/lib/hospital-routing")
        const ranked = rankHospitals(pos.coords.latitude, pos.coords.longitude, hospitals, complaint, urgencyLevel)
        setRankedHospitals(ranked)
        if (ranked.length > 0) {
          setSelectedHospital(ranked[0])
        }
        setLocType("geo")
        setGeoLoading(false)
      },
      () => {
        setGeoError("Position refusée. Sélectionnez un centre dans la liste.")
        setGeoLoading(false)
      },
      { timeout: 10000 }
    )
  }

  async function handleSubmit() {
    if (!selectedHospital) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint: complaint,
          urgencyLevel,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
          phone: phone || undefined,
          hospitalId: selectedHospital.id,
        }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      const data = await res.json() as { id: string; qrCode: string }
      setTriageId(data.id)
      setStep(4)
    } catch {
      alert("Erreur lors de l'envoi. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  // Generate QR code on step 4
  useEffect(() => {
    if (step !== 4 || !triageId || !qrCanvasRef.current) return
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(qrCanvasRef.current!, `TRIAGE:${triageId}`, {
        width: 240,
        margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      })
    })
  }, [step, triageId])

  // ─── STEP 1: Pathologie ───────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Qu&apos;est-ce qui vous amène ?</h1>
          <p className="text-gray-500 text-sm mt-1">Sélectionnez votre motif principal</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMPLAINTS.map((c) => (
            <button
              key={c.id}
              onClick={() => selectComplaint(c)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-left ${URGENCY_COLORS[c.urgency]}`}
            >
              <span className="text-3xl">{c.icon}</span>
              <div>
                <div className="font-bold text-gray-900 text-sm leading-tight">{c.id}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    )
  }

  // ─── STEP 2: Infos personnelles ───────────────────────────────────
  if (step === 2) {
    return (
      <div className="w-full max-w-md space-y-4">
        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${URGENCY_BADGE[urgencyLevel]}`}>
              {URGENCY_LABEL[urgencyLevel]}
            </span>
            <span className="font-semibold text-gray-700">{complaint}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Informations personnelles</h2>
          <p className="text-sm text-gray-500 mb-4">Optionnel — mais utile en cas d&apos;urgence</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" placeholder="Jean" />
              </div>
              <div>
                <label className="label">Nom</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" placeholder="Dupont" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Année de naissance</label>
                <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} className="input-field" placeholder="1980" min="1900" max={new Date().getFullYear()} />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="06 12 34 56 78" />
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setStep(3)} className="btn-primary w-full">
          Continuer →
        </button>
      </div>
    )
  }

  // ─── STEP 3: Localisation ─────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="w-full max-w-md space-y-4">
        <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Où êtes-vous ?</h2>
          <p className="text-gray-500 text-sm mt-1">Pour vous orienter vers le centre le plus adapté</p>
        </div>

        {/* Option A: already in a center */}
        <button
          onClick={() => setLocType("here")}
          className={`w-full card text-left flex items-center gap-4 transition ${locType === "here" ? "border-blue-500 bg-blue-50" : "hover:border-blue-300"}`}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">🏥</div>
          <div>
            <div className="font-bold text-gray-900">Je suis dans un centre de soins</div>
            <div className="text-sm text-gray-500">Sélectionnez l&apos;établissement</div>
          </div>
        </button>

        {locType === "here" && (
          <div className="card space-y-2">
            <label className="label">Choisir l&apos;établissement</label>
            <div className="relative">
              <input
                type="text"
                className="input-field"
                placeholder="Tapez un nom d'établissement ou une ville…"
                value={searchQuery || selectedHospital?.name || ""}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSelectedHospital(null)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && searchQuery.length >= 2 && (() => {
                const q = searchQuery.toLowerCase()
                const matches = hospitals.filter(h =>
                  h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
                ).slice(0, 8)
                return matches.length > 0 ? (
                  <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {matches.map(h => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSelectedHospital(h)
                            setSearchQuery("")
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{h.name}</div>
                              <div className="text-xs text-gray-500">{h.city}</div>
                            </div>
                            <span className="text-xs font-bold text-blue-600 shrink-0">{h.type}</span>
                          </div>
                          <AffluenceBar score={getAffluenceScore(h.id)} />
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
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-blue-900">{selectedHospital.name}</div>
                  <div className="text-xs text-blue-600">{selectedHospital.city} · {selectedHospital.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedHospital(null); setSearchQuery("") }}
                  className="text-blue-400 hover:text-blue-700 text-lg leading-none"
                >×</button>
              </div>
            )}
          </div>
        )}

        {/* Option B: geolocate */}
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className={`w-full card text-left flex items-center gap-4 transition ${locType === "geo" ? "border-green-500 bg-green-50" : "hover:border-green-300"}`}
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
            {geoLoading ? "⌛" : "📍"}
          </div>
          <div>
            <div className="font-bold text-gray-900">{geoLoading ? "Localisation en cours…" : "Me géolocaliser"}</div>
            <div className="text-sm text-gray-500">Trouver le centre le plus proche</div>
          </div>
        </button>

        {geoError && <p className="text-sm text-red-600">{geoError}</p>}

        {locType === "geo" && rankedHospitals.length > 0 && (
          <div className="card space-y-2">
            <div className="text-sm text-gray-500">Centres à proximité :</div>
            {rankedHospitals.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHospital(h)}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${selectedHospital?.id === h.id ? "border-blue-500 bg-blue-50" : h.recommended ? "border-green-400 bg-green-50 hover:bg-green-100" : "border-gray-200 hover:border-blue-300"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {h.recommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-bold">
                          ✓ Recommandé
                        </span>
                      )}
                      <span className="font-semibold text-gray-900 text-sm">{h.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{h.city} · <span className="font-medium text-blue-600">{h.type}</span></div>
                    {h.recommendReason && (
                      <div className="text-xs text-green-700 mt-0.5 font-medium">{h.recommendReason}</div>
                    )}
                    {h.phone && <div className="text-xs text-gray-400">{h.phone}</div>}
                  </div>
                  <div className="text-sm font-bold text-blue-700 shrink-0">{h.distanceKm.toFixed(1)} km</div>
                </div>
                <AffluenceBar score={h.affluenceScore} />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedHospital || submitting}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitting ? "Génération du QR code…" : "Générer mon QR code →"}
        </button>
      </div>
    )
  }

  // ─── STEP 4: QR code ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-md space-y-4 text-center">
      <div>
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Votre QR code est prêt</h2>
        <p className="text-sm text-gray-500 mt-1">Présentez-le à l&apos;agent d&apos;accueil ou à l&apos;IAO</p>
      </div>

      {/* Urgency + hospital */}
      <div className="card">
        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-bold mb-3 ${URGENCY_BADGE[urgencyLevel]}`}>
          {URGENCY_LABEL[urgencyLevel]}
        </div>
        <div className="font-bold text-gray-900">{complaint}</div>
        {(firstName || lastName) && (
          <div className="text-gray-600 mt-1">{firstName} {lastName}</div>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
          <div className="font-semibold">{selectedHospital?.name}</div>
          <div className="text-xs text-gray-400">{selectedHospital?.address}</div>
        </div>
      </div>

      {/* QR code */}
      <div className="card flex flex-col items-center gap-3">
        <canvas ref={qrCanvasRef} className="rounded-lg" />
        {triageId && (
          <p className="text-xs text-gray-400 font-mono">TRIAGE:{triageId}</p>
        )}
      </div>

      {/* Account link */}
      <div className="card bg-blue-50 border-blue-200 text-sm">
        <p className="text-blue-800">
          <strong>Envie de garder un historique ?</strong> Créez un compte pour retrouver toutes vos consultations.
        </p>
        <div className="flex gap-2 mt-3">
          <Link href="/register" className="flex-1 btn-primary text-center text-sm py-2">
            Créer un compte
          </Link>
          <Link href="/login" className="flex-1 btn-secondary text-center text-sm py-2">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
