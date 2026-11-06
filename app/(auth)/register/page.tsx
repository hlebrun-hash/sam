"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { registerAction } from "./actions"
import { IdentityFields } from "@/components/AdminFields"

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-2 shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-blue-900">SAM — Créer un compte patient</h1>
        <p className="text-sm text-gray-500 mt-1">Ces informations permettent une prise en charge optimale</p>
      </div>

      <div className="card">
        {error && (
          <div className="alert-warning mb-4">
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => signIn("franceconnect", { redirectTo: "/patient/post-login" })}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-800 bg-blue-900 hover:bg-blue-800 text-white font-semibold transition"
        >
          <span className="bg-white text-blue-900 rounded px-1.5 py-0.5 text-sm font-extrabold">FC</span>
          <span>Créer mon compte avec FranceConnect</span>
        </button>
        <p className="text-xs text-gray-400 text-center mt-2 mb-4">
          Recommandé : identité vérifiée via France Identité, impots.gouv.fr, ameli… Les informations manquantes vous seront demandées ensuite.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">ou remplissez le formulaire</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identité */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Identité</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="label">Prénom *</label>
                  <input id="firstName" name="firstName" type="text" required placeholder="Prénom" className="input-field" />
                </div>
                <div>
                  <label htmlFor="lastName" className="label">Nom *</label>
                  <input id="lastName" name="lastName" type="text" required placeholder="Nom" className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="birthDate" className="label">Date de naissance *</label>
                  <input id="birthDate" name="birthDate" type="date" required className="input-field" />
                </div>
                <div>
                  <label htmlFor="birthCity" className="label">Ville de naissance *</label>
                  <input id="birthCity" name="birthCity" type="text" required placeholder="Ville" className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Sexe *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "HOMME", label: "Homme", icon: "♂" },
                    { value: "FEMME", label: "Femme", icon: "♀" },
                    { value: "AUTRE", label: "Autre / NB", icon: "⚧" },
                  ].map((g) => (
                    <label key={g.value} className="flex items-center gap-2 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input type="radio" name="gender" value={g.value} required className="sr-only" />
                      <span className="text-lg">{g.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="label">Téléphone</label>
                <input id="phone" name="phone" type="tel" placeholder="06 12 34 56 78" className="input-field" />
              </div>
            </div>
          </div>

          {/* Identité administrative & adresse */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Adresse &amp; état civil</h2>
            <p className="text-xs text-gray-400 mb-3">Facultatif en urgence, mais très utile pour votre admission : recopiez ces informations comme sur votre pièce d&apos;identité.</p>
            <IdentityFields values={{}} />
          </div>

          {/* Morphologie — pour le dosage */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Morphologie</h2>
            <p className="text-xs text-gray-400 mb-3">Utile pour le calcul des dosages médicamenteux</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="height" className="label">Taille (cm)</label>
                <input id="height" name="height" type="number" min="50" max="250" placeholder="ex : 175" className="input-field" />
              </div>
              <div>
                <label htmlFor="weight" className="label">Poids (kg)</label>
                <input id="weight" name="weight" type="number" min="1" max="400" step="0.1" placeholder="ex : 70" className="input-field" />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="label">Groupe sanguin</label>
                <select id="bloodGroup" name="bloodGroup" className="input-field">
                  <option value="">— Inconnu —</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Médecin traitant */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Médecin traitant</h2>
            <p className="text-xs text-gray-400 mb-3">Votre médecin généraliste ou référent habituel (sera pré-rempli dans vos fiches)</p>
            <div>
              <label htmlFor="treatingDoctor" className="label">Nom du médecin traitant</label>
              <input id="treatingDoctor" name="treatingDoctor" type="text" placeholder="Ex : Dr. Martin Sophie" className="input-field" />
            </div>
            <div className="mt-3">
              <label htmlFor="treatingDoctorPhone" className="label">Téléphone du médecin traitant</label>
              <input id="treatingDoctorPhone" name="treatingDoctorPhone" type="tel" placeholder="01 23 45 67 89" className="input-field" />
            </div>
          </div>

          {/* Vaccins */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Vaccins</h2>
            <p className="text-xs text-gray-400 mb-3">Vaccins obligatoires et rappels (DTP, hépatite B, etc.)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "OUI", label: "À jour", desc: "Tous les rappels effectués" },
                { value: "PARTIEL", label: "Partiellement", desc: "Certains manquants" },
                { value: "NON", label: "Non / Inconnu", desc: "Pas à jour ou incertain" },
              ].map((v) => (
                <label key={v.value} className="flex flex-col p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="vaccinesUpToDate" value={v.value} className="sr-only" />
                  <span className="text-sm font-semibold text-gray-800">{v.label}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{v.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Connexion */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Connexion</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="label">Email *</label>
                <input id="email" name="email" type="email" required placeholder="votre@email.fr" className="input-field" />
              </div>
              <div>
                <label htmlFor="password" className="label">Mot de passe *</label>
                <input id="password" name="password" type="password" required minLength={8} placeholder="8 caractères minimum" className="input-field" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
            {isPending ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
