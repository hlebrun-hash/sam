"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { searchPatients, type SearchablePatient } from "@/lib/fuzzy-search"
import Avatar from "@/components/Avatar"

type Props = {
  patients: SearchablePatient[]
  role: string
}

export default function PatientSearch({ patients, role }: Props) {
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [birthCity, setBirthCity] = useState("")

  const results = useMemo(() => {
    if (!lastName && !firstName) return []
    return searchPatients(patients, { lastName, firstName, birthDate: birthDate || undefined, birthCity: birthCity || undefined })
  }, [patients, lastName, firstName, birthDate, birthCity])

  const hasQuery = lastName.length > 0 || firstName.length > 0

  return (
    <div className="space-y-4">
      {/* Search form */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nom *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Dupont"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Date de naissance</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Ville de naissance</label>
            <input
              type="text"
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              placeholder="Paris"
              className="input-field"
            />
          </div>
        </div>

        {hasQuery && (
          <p className="text-sm text-gray-500">
            {results.length === 0
              ? "Aucun patient trouvé"
              : `${results.length} résultat${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.length > 1 && (
            <div className="alert-warning">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Homonymes détectés.</strong> Vérifiez la date et la ville de naissance avant d&apos;ouvrir un dossier.
              </span>
            </div>
          )}

          {results.map((p) => (
            <Link
              key={p.id}
              href={`/hopital/patient/${p.id}`}
              className="card flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition group"
            >
              <Avatar
                firstName={p.firstName}
                lastName={p.lastName}
                photoUrl={p.photoUrl}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 group-hover:text-blue-700">
                  {p.lastName.toUpperCase()}, {p.firstName}
                </p>
                <p className="text-sm text-gray-500">
                  Né(e) le {new Date(p.birthDate).toLocaleDateString("fr-FR")} à {p.birthCity}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {p.bloodGroup && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {p.bloodGroup}
                  </span>
                )}
                {p.validatedAt ? (
                  <span className="text-xs text-green-700 font-medium">✓ Validé</span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">⏳ Non validé</span>
                )}
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!hasQuery && (
        <div className="card text-center py-10 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="font-medium">Entrez un nom pour commencer la recherche</p>
          <p className="text-sm mt-1">La recherche est floue et insensible aux accents</p>
        </div>
      )}
    </div>
  )
}
