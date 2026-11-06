"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import type { HospitalForRouting, ScoredHospital } from "@/lib/hospital-routing"
import { getAffluenceScore } from "@/lib/hospital-routing"

type Props = {
  hospitals: HospitalForRouting[]
  patientFirstName: string
  patientLastName: string
}

const COMPLAINTS = [
  { id: "Hémorragie",                 icon: "🩸", sub: "Saignement important",     urgency: "CRITIQUE" },
  { id: "Douleur thoracique",         icon: "❤️", sub: "Cardiaque, infarctus",     urgency: "CRITIQUE" },
  { id: "Difficultés respiratoires",  icon: "🫁", sub: "Souffle, asphyxie",        urgency: "CRITIQUE" },
  { id: "Perte de conscience",        icon: "🧠", sub: "AVC, syncope",             urgency: "CRITIQUE" },
  { id: "Fracture",                   icon: "🦴", sub: "Os cassé, traumatisme",    urgency: "HAUTE"    },
  { id: "Brûlure",                    icon: "🔥", sub: "Chaleur, produit chimique",urgency: "HAUTE"    },
  { id: "Douleur intense",            icon: "🤕", sub: "Niveau élevé",             urgency: "HAUTE"    },
  { id: "Douleur abdominale",         icon: "🤢", sub: "Ventre, nausées",          urgency: "MODEREE"  },
  { id: "Fièvre",                     icon: "🌡️", sub: "Température élevée",      urgency: "MODEREE"  },
  { id: "Plaie",                      icon: "🩹", sub: "Coupure, blessure",        urgency: "MODEREE"  },
  { id: "Autre",                      icon: "✳️", sub: "Autre problème",          urgency: "MODEREE"  },
]

const URGENCY_COLORS: Record<string, string> = {
  CRITIQUE: "border-red-400 bg-red-50 hover:bg-red-100",
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function UrgenceRapideButton({ hospitals, patientFirstName, patientLastName }: Props) {
  const [open, setOpen]                   = useState(false)
  const [step, setStep]                   = useState(1)
  const [complaint, setComplaint]         = useState("")
  const [urgencyLevel, setUrgencyLevel]   = useState("MODEREE")
  const [locType, setLocType]             = useState<"here" | "geo" | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<HospitalForRouting | null>(null)
  const [searchQuery, setSearchQuery]     = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geoLoading, setGeoLoading]       = useState(false)
  const [geoError, setGeoError]           = useState<string | null>(null)
  const [rankedHospitals, setRankedHospitals] = useState<ScoredHospital[]>([])
  const [showAllHospitals, setShowAllHospitals] = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [triageId, setTriageId]           = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  // getAffluenceScore est importé depuis lib/hospital-routing
  const affluence = useMemo(
    () => new Map(hospitals.map(h => [h.id, getAffluenceScore(h.id)])),
    [hospitals]
  )

  function reset() {
    setStep(1); setComplaint(""); setUrgencyLevel("MODEREE")
    setLocType(null); setSelectedHospital(null); setSearchQuery("")
    setRankedHospitals([]); setGeoError(null); setTriageId(null); setShowAllHospitals(false)
  }

  function handleClose() { setOpen(false); reset() }

  function selectComplaint(c: typeof COMPLAINTS[0]) {
    setComplaint(c.id); setUrgencyLevel(c.urgency); setStep(2)
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée. Sélectionnez un centre manuellement.")
      return
    }
    setGeoLoading(true); setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { rankHospitals } = await import("@/lib/hospital-routing")
        const ranked = rankHospitals(pos.coords.latitude, pos.coords.longitude, hospitals, complaint, urgencyLevel)
        setRankedHospitals(ranked)
        if (ranked.length > 0) setSelectedHospital(ranked[0])
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
          firstName: patientFirstName,
          lastName: patientLastName,
          hospitalId: selectedHospital.id,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { id: string }
      setTriageId(data.id)
      setStep(3)
    } catch {
      alert("Erreur lors de l'envoi. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  // Generate QR on step 3
  useEffect(() => {
    if (step !== 3 || !triageId || !qrCanvasRef.current) return
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(qrCanvasRef.current!, `TRIAGE:${triageId}`, {
        width: 220,
        margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      })
    })
  }, [step, triageId])

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-red-400 bg-red-50 hover:bg-red-100 transition group"
      >
        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:bg-red-600 transition">
          <span className="text-2xl">🚨</span>
        </div>
        <div className="text-left flex-1">
          <div className="font-bold text-red-800 text-base">Consulter en urgence</div>
          <div className="text-xs text-red-600">Trouver le centre le plus adapté près de vous</div>
        </div>
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

          {/* Panel */}
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <div className="font-bold text-gray-900">Urgence rapide</div>
                  <div className="text-xs text-gray-500">
                    {step === 1 && "Étape 1 — Motif"}
                    {step === 2 && "Étape 2 — Localisation"}
                    {step === 3 && "QR code prêt"}
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition">
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ── STEP 1 : Motif ── */}
              {step === 1 && (
                <>
                  <p className="text-sm text-gray-500">Qu&apos;est-ce qui vous amène aux urgences ?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {COMPLAINTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectComplaint(c)}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition text-left ${URGENCY_COLORS[c.urgency]}`}
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="font-bold text-gray-900 text-xs leading-tight">{c.id}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── STEP 2 : Localisation ── */}
              {step === 2 && (
                <>
                  <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>

                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${URGENCY_BADGE[urgencyLevel]}`}>
                    {URGENCY_LABEL[urgencyLevel]} · {complaint}
                  </div>

                  <p className="font-semibold text-gray-900">Où êtes-vous ?</p>

                  {/* Option A — Je suis dans un centre */}
                  <button
                    onClick={() => { setLocType("here"); setSelectedHospital(null); setRankedHospitals([]) }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition text-left ${locType === "here" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">🏥</div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">Je suis dans un centre de soins</div>
                      <div className="text-xs text-gray-500">Sélectionnez l&apos;établissement</div>
                    </div>
                  </button>

                  {locType === "here" && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Tapez un nom ou une ville…"
                          value={searchQuery || selectedHospital?.name || ""}
                          onChange={e => { setSearchQuery(e.target.value); setSelectedHospital(null); setShowSuggestions(true) }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                          autoComplete="off"
                        />
                        {showSuggestions && searchQuery.length >= 2 && (() => {
                          const q = searchQuery.toLowerCase()
                          const matches = hospitals.filter(h =>
                            h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
                          ).slice(0, 6)
                          return matches.length > 0 ? (
                            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                              {matches.map(h => {
                                const sc = affluence.get(h.id) ?? 50
                                return (
                                  <li key={h.id}>
                                    <button
                                      type="button"
                                      onMouseDown={() => { setSelectedHospital(h); setSearchQuery(""); setShowSuggestions(false) }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50"
                                    >
                                      <div className="text-sm font-semibold text-gray-900">{h.name}</div>
                                      <div className="text-xs text-gray-500 mb-1">{h.city} · {h.type}</div>
                                      <AffluenceBar score={sc} />
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          ) : (
                            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                              Aucun établissement trouvé
                            </div>
                          )
                        })()}
                      </div>
                      {selectedHospital && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-blue-900">{selectedHospital.name}</div>
                              <div className="text-xs text-blue-600">{selectedHospital.city} · {selectedHospital.type}</div>
                            </div>
                            <button onClick={() => { setSelectedHospital(null); setSearchQuery("") }} className="text-blue-400 hover:text-blue-700 text-lg">×</button>
                          </div>
                          <AffluenceBar score={affluence.get(selectedHospital.id) ?? 50} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option B — Géolocalisation */}
                  <button
                    onClick={handleGeolocate}
                    disabled={geoLoading}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition text-left ${locType === "geo" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                      {geoLoading ? "⌛" : "📍"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{geoLoading ? "Localisation en cours…" : "Me géolocaliser"}</div>
                      <div className="text-xs text-gray-500">Trouver le centre le plus proche</div>
                    </div>
                  </button>

                  {geoError && <p className="text-sm text-red-600">{geoError}</p>}

                  {locType === "geo" && rankedHospitals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Centres à proximité</p>
                      {(showAllHospitals ? rankedHospitals : rankedHospitals.slice(0, 5)).map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setSelectedHospital(h)}
                          className={`w-full p-3 rounded-xl border-2 transition text-left ${selectedHospital?.id === h.id ? "border-blue-500 bg-blue-50" : h.recommended ? "border-green-400 bg-green-50 hover:bg-green-100" : "border-gray-200 hover:border-blue-300"}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {h.recommended && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-600 text-white text-xs font-bold">
                                    ✓ Recommandé
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-gray-900">{h.name}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{h.city} · <span className="font-medium text-blue-600">{h.type}</span></div>
                              {h.recommendReason && (
                                <div className="text-xs text-green-700 mt-0.5 font-medium">{h.recommendReason}</div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-blue-700 shrink-0">{h.distanceKm.toFixed(1)} km</span>
                          </div>
                          <AffluenceBar score={h.affluenceScore} />
                        </button>
                      ))}
                      {!showAllHospitals && rankedHospitals.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllHospitals(true)}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition font-medium"
                        >
                          Voir les {rankedHospitals.length - 5} autres établissements →
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedHospital || submitting}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {submitting ? "Génération du QR code…" : "Générer mon QR code →"}
                  </button>
                </>
              )}

              {/* ── STEP 3 : QR code ── */}
              {step === 3 && (
                <div className="text-center space-y-4">
                  <div>
                    <div className="text-4xl mb-2">✅</div>
                    <h2 className="text-xl font-bold text-gray-900">Votre QR code est prêt</h2>
                    <p className="text-sm text-gray-500 mt-1">Présentez-le à l&apos;agent d&apos;accueil ou à l&apos;IAO</p>
                  </div>

                  <div className="card text-left">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-bold mb-3 ${URGENCY_BADGE[urgencyLevel]}`}>
                      {URGENCY_LABEL[urgencyLevel]}
                    </div>
                    <div className="font-bold text-gray-900">{complaint}</div>
                    <div className="text-gray-600 mt-1">{patientFirstName} {patientLastName}</div>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                      <div className="font-semibold">{selectedHospital?.name}</div>
                      <div className="text-xs text-gray-400">{selectedHospital?.address}</div>
                      {selectedHospital && (
                        <AffluenceBar score={"affluenceScore" in selectedHospital ? (selectedHospital as ScoredHospital).affluenceScore : (affluence.get(selectedHospital.id) ?? 50)} />
                      )}
                    </div>
                  </div>

                  <div className="card flex flex-col items-center gap-3">
                    <canvas ref={qrCanvasRef} className="rounded-lg" />
                    {triageId && (
                      <p className="text-xs text-gray-400 font-mono">TRIAGE:{triageId}</p>
                    )}
                  </div>

                  <button onClick={handleClose} className="btn-secondary w-full">
                    Fermer
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}
