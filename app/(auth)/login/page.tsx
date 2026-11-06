"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { loginAction } from "./actions"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-3 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-blue-900">SAM</h1>
        <p className="text-sm text-gray-500">Service d&apos;Accès Médical</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Connexion</h2>

        {/* FranceConnect : France Identité, impots.gouv.fr, ameli, La Poste… */}
        <button
          type="button"
          onClick={() => signIn("franceconnect", { redirectTo: "/patient/post-login" })}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-blue-800 bg-blue-900 hover:bg-blue-800 text-white font-semibold transition mb-4"
        >
          <svg width="22" height="22" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="60" rx="8" fill="#003189"/>
            <text x="10" y="42" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#ffffff">FC</text>
          </svg>
          <span>S&apos;identifier avec FranceConnect</span>
        </button>
        <p className="text-xs text-gray-400 text-center -mt-2 mb-4">
          Avec France Identité, impots.gouv.fr, ameli ou La Poste — votre identité est vérifiée par l&apos;État.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">ou</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {error && (
          <div className="alert-warning mb-4">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="votre@email.fr"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-blue-700 font-semibold hover:underline">
            S&apos;inscrire
          </Link>
        </p>

        {/* Demo hint */}
        <details className="mt-6">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Comptes de démonstration
          </summary>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs font-mono space-y-1 text-gray-600">
            <p><strong>Urgentiste :</strong> urgentiste.versailles@sam.demo</p>
            <p><strong>IAO :</strong> iao.versailles@sam.demo</p>
            <p><strong>Accueil :</strong> accueil.versailles@sam.demo</p>
            <p><strong>Admin :</strong> admin.versailles@sam.demo</p>
            <p><strong>Patient :</strong> jean.dupont@sam.demo</p>
            <p className="mt-1 text-gray-500">Mot de passe universel : <strong>demo1234</strong></p>
          </div>
        </details>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/" className="hover:underline">← Retour à l&apos;accueil</Link>
      </p>
    </div>
  )
}
