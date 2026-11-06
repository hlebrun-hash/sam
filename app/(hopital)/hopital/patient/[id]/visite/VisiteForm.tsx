"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { enregistrerVisiteAction } from "./actions"

type Props = {
  patientId: string
  hospitals: Array<{ id: string; name: string }>
  defaultHospitalId?: string
}

export default function VisiteForm({ patientId, hospitals, defaultHospitalId }: Props) {
  const router = useRouter()
  const [hospitalId, setHospitalId] = useState(defaultHospitalId ?? "")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hospitalId || !reason.trim()) {
      setError("L'hôpital et le motif sont obligatoires.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await enregistrerVisiteAction(patientId, { hospitalId, reason, notes, date })
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/hopital/patient/${patientId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label">Hôpital *</label>
        <select
          value={hospitalId}
          onChange={(e) => setHospitalId(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Sélectionner…</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Date du passage *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
          max={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      <div>
        <label className="label">Motif de passage *</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex : Douleurs thoraciques, chute, fièvre…"
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="label">Notes cliniques (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, orientation, traitement…"
          rows={3}
          className="input-field w-full resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? "Enregistrement…" : "Enregistrer le passage"}
        </button>
      </div>
    </form>
  )
}
