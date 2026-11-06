"use client"

import { useState, useTransition } from "react"
import { addStaffAction } from "./actions"

type Props = { hospitalId: string }

const ROLES = [
  { value: "ACCUEIL", label: "Accueil" },
  { value: "IAO", label: "IAO" },
  { value: "INFIRMIER", label: "Infirmier(e)" },
  { value: "URGENTISTE", label: "Urgentiste" },
]

export default function AddStaffForm({ hospitalId }: Props) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("ACCUEIL")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData()
    formData.set("hospitalId", hospitalId)
    formData.set("firstName", firstName)
    formData.set("lastName", lastName)
    formData.set("email", email)
    formData.set("role", role)
    startTransition(async () => {
      const result = await addStaffAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`${firstName} ${lastName} ajouté(e) avec succès. Mot de passe temporaire : demo1234`)
        setFirstName("")
        setLastName("")
        setEmail("")
        setRole("ACCUEIL")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Prénom *</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="label">Nom *</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
        </div>
        <div>
          <label className="label">Rôle *</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <div className="alert-success">{success}</div>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Ajout en cours…" : "Ajouter le membre"}
      </button>
    </form>
  )
}
