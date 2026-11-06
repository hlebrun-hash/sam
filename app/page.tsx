import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    redirect(getDashboardPath(session.user.role as Role))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-blue-900">SAM</h1>
          <p className="text-xl text-blue-700 font-medium">Service d&apos;Accès Médical</p>
          <p className="mt-2 text-gray-600">Votre dossier médical, accessible partout, en toute sécurité.</p>
        </div>

        {/* URGENT CTA */}
        <Link
          href="/triage"
          className="block w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl p-5 text-center shadow-lg transition group"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <div className="text-xl font-bold">Consulter en urgence</div>
              <div className="text-sm text-red-100 mt-0.5">Sans compte — QR code généré en 30 secondes</div>
            </div>
          </div>
        </Link>

        {/* Two entry points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Patient */}
          <div className="card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Espace patient</h2>
                <p className="text-sm text-gray-500">Accédez à votre dossier complet</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Historique de vos passages</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> QR code personnel permanent</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Allergies, traitements, antécédents</li>
            </ul>
            <div className="flex flex-col gap-2 mt-auto">
              <Link href="/login" className="btn-primary text-center">
                Se connecter
              </Link>
              <Link href="/register" className="btn-secondary text-center">
                Créer un compte
              </Link>
            </div>
          </div>

          {/* Staff */}
          <div className="card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Personnel hospitalier</h2>
                <p className="text-sm text-gray-500">Accueil · IAO · Infirmiers · Urgentistes</p>
              </div>
            </div>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Scan QR code patient ou triage</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Recherche floue multi-hôpitaux</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Allergies visibles en urgence</li>
            </ul>
            <div className="mt-auto">
              <Link href="/login" className="btn-primary w-full text-center">
                Connexion personnel
              </Link>
            </div>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong className="text-amber-900">Comptes de démo — mot de passe universel : <code className="bg-amber-100 px-1.5 rounded font-mono">demo1234</code></strong>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-amber-700 border-b border-amber-200">
                  <th className="pb-1 pr-4 font-semibold">Rôle</th>
                  <th className="pb-1 pr-4 font-semibold">Email</th>
                  <th className="pb-1 font-semibold">Scénario jury</th>
                </tr>
              </thead>
              <tbody className="text-amber-900 divide-y divide-amber-100">
                <tr>
                  <td className="py-1.5 pr-4 font-medium">Patient</td>
                  <td className="py-1.5 pr-4"><code className="bg-amber-100 px-1 rounded font-mono text-xs">jean.dupont@sam.demo</code></td>
                  <td className="py-1.5 text-xs text-amber-700">Consulter son dossier, QR code</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-medium">Accueil</td>
                  <td className="py-1.5 pr-4"><code className="bg-amber-100 px-1 rounded font-mono text-xs">accueil.versailles@sam.demo</code></td>
                  <td className="py-1.5 text-xs text-amber-700">Scan QR triage ou patient</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-medium">IAO</td>
                  <td className="py-1.5 pr-4"><code className="bg-amber-100 px-1 rounded font-mono text-xs">iao.versailles@sam.demo</code></td>
                  <td className="py-1.5 text-xs text-amber-700">Valider le dossier de Jean Dupont</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-medium">Urgentiste</td>
                  <td className="py-1.5 pr-4"><code className="bg-amber-100 px-1 rounded font-mono text-xs">urgentiste.versailles@sam.demo</code></td>
                  <td className="py-1.5 text-xs text-amber-700">Bris de glace — patient inconscient</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-medium">Admin</td>
                  <td className="py-1.5 pr-4"><code className="bg-amber-100 px-1 rounded font-mono text-xs">admin.versailles@sam.demo</code></td>
                  <td className="py-1.5 text-xs text-amber-700">Personnel + journal d&apos;audit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}
