"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { completeIdentityAction } from "./actions"

type Missing = { email: boolean; birthCity: boolean; gender: boolean; birthDate: boolean }

export default function CompleteIdentityForm({ missing }: { missing: Missing }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await completeIdentityAction(fd)
      if ("error" in res) setError(res.error)
      else router.push("/patient/post-login")
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <div className="alert-warning">{error}</div>}

      {missing.birthDate && (
        <div>
          <label htmlFor="birthDate" className="label">Date de naissance *</label>
          <input id="birthDate" name="birthDate" type="date" required className="input-field" />
        </div>
      )}
      {missing.birthCity && (
        <div>
          <label htmlFor="birthCity" className="label">Ville de naissance *</label>
          <input id="birthCity" name="birthCity" type="text" required placeholder="Ville de naissance" className="input-field" />
        </div>
      )}
      {missing.gender && (
        <div>
          <label className="label">Sexe *</label>
          <div className="grid grid-cols-3 gap-2">
            {[["HOMME", "Homme"], ["FEMME", "Femme"], ["AUTRE", "Autre / NB"]].map(([v, l]) => (
              <label key={v} className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input type="radio" name="gender" value={v} required className="sr-only" />
                <span className="text-sm font-medium text-gray-800">{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {missing.email && (
        <div>
          <label htmlFor="email" className="label">Email *</label>
          <input id="email" name="email" type="email" required placeholder="votre@email.fr" className="input-field" />
        </div>
      )}

      <div>
        <label htmlFor="phone" className="label">Téléphone mobile</label>
        <input id="phone" name="phone" type="tel" placeholder="06 12 34 56 78" className="input-field" />
        <p className="text-xs text-gray-400 mt-1">Non fourni par FranceConnect. Facultatif mais utile en cas d&apos;urgence.</p>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Enregistrement…" : "Continuer"}
      </button>
    </form>
  )
}
