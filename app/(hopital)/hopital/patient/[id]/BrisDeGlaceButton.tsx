"use client"

import { useState, useTransition } from "react"
import { brisDeGlaceAction } from "./actions"

type Props = {
  patientId: string
  patientName: string
}

export default function BrisDeGlaceButton({ patientId, patientName }: Props) {
  const [open, setOpen] = useState(false)
  const [justification, setJustification] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setOpen(true)
    setError(null)
    setJustification("")
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
  }

  function handleConfirm() {
    if (!justification.trim()) {
      setError("La justification est obligatoire.")
      return
    }
    startTransition(async () => {
      const result = await brisDeGlaceAction(patientId, justification)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
        setTimeout(() => setOpen(false), 1500)
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="btn-danger text-sm py-2 px-4 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Bris de glace
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleClose}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Mode bris de glace</h2>
                <p className="text-sm text-gray-500">Patient : <strong>{patientName}</strong></p>
              </div>
            </div>

            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">
                <strong>⚠ Accès d&apos;urgence.</strong> Cette action est enregistrée dans le journal d&apos;audit
                avec votre identité, la date et la justification. Elle ne peut pas être annulée.
              </p>
            </div>

            {done ? (
              <div className="alert-success">✓ Accès d&apos;urgence accordé. Journalisé.</div>
            ) : (
              <>
                <div>
                  <label className="label">Justification médicale *</label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ex : Patient inconscient, allergie suspectée, nécessité d'accès immédiat au dossier"
                    rows={3}
                    className="input-field w-full resize-none"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={handleClose} className="btn-secondary flex-1" disabled={isPending}>
                    Annuler
                  </button>
                  <button onClick={handleConfirm} disabled={isPending} className="btn-danger flex-1">
                    {isPending ? "En cours..." : "Confirmer l'accès d'urgence"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
