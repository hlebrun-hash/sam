"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { validerDossierAction } from "./actions"

type Props = { patientId: string; patientName: string }

export default function ValiderForm({ patientId, patientName }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirmed) {
      setError("Cochez la case de confirmation avant de valider.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await validerDossierAction(patientId, notes)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/hopital/patient/${patientId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-bold text-gray-900">Confirmer la validation</h3>

      <div>
        <label className="label">Notes de validation (optionnel)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Remarques, précisions…"
          rows={3}
          className="input-field w-full resize-none"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 w-5 h-5 rounded accent-blue-700"
        />
        <span className="text-sm text-gray-700">
          Je certifie avoir vérifié l&apos;identité du patient{" "}
          <strong>{patientName}</strong> et l&apos;exactitude des informations médicales renseignées.
        </span>
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Annuler
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? "Validation en cours..." : "✓ Valider le dossier"}
        </button>
      </div>
    </form>
  )
}
