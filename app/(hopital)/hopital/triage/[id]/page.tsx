import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

const URGENCY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  CRITIQUE: { bg: "bg-red-600", text: "text-white", label: "CRITIQUE" },
  HAUTE: { bg: "bg-orange-500", text: "text-white", label: "HAUTE" },
  MODEREE: { bg: "bg-amber-400", text: "text-white", label: "MODÉRÉE" },
  FAIBLE: { bg: "bg-green-500", text: "text-white", label: "FAIBLE" },
}

export default async function TriagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const triage = await prisma.triageRequest.findUnique({
    where: { id },
    include: { hospital: true },
  })

  if (!triage) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Fiche de triage introuvable ou expirée.</p>
        <Link href="/hopital/recherche" className="btn-primary mt-4 inline-block">
          Rechercher un patient
        </Link>
      </div>
    )
  }

  const urgency = URGENCY_STYLES[triage.urgencyLevel] ?? URGENCY_STYLES.MODEREE
  const elapsed = Math.round((Date.now() - triage.createdAt.getTime()) / 60000)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/hopital/scan" className="text-sm text-gray-500 hover:text-gray-700">
          ← Scanner
        </Link>
      </div>

      {/* Urgency banner */}
      <div className={`${urgency.bg} ${urgency.text} rounded-xl p-4 flex items-center gap-3`}>
        <div className="text-3xl">
          {triage.urgencyLevel === "CRITIQUE" ? "🚨" : triage.urgencyLevel === "HAUTE" ? "⚠️" : "ℹ️"}
        </div>
        <div>
          <div className="text-sm font-semibold opacity-80">Niveau d&apos;urgence</div>
          <div className="text-2xl font-bold">{urgency.label}</div>
        </div>
      </div>

      {/* Main info */}
      <div className="card space-y-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Motif de consultation</div>
          <div className="text-xl font-bold text-gray-900 capitalize">{triage.chiefComplaint}</div>
        </div>

        {(triage.firstName || triage.lastName) && (
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Patient</div>
            <div className="text-lg font-semibold text-gray-800">
              {triage.firstName} {triage.lastName}
              {triage.birthYear && <span className="ml-2 text-sm text-gray-500">({new Date().getFullYear() - triage.birthYear} ans)</span>}
            </div>
          </div>
        )}

        {!triage.firstName && !triage.lastName && (
          <div className="alert-warning text-sm">
            Patient non identifié — demander une pièce d&apos;identité
          </div>
        )}

        {triage.phone && (
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</div>
            <div className="font-medium text-gray-800">{triage.phone}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Établissement</div>
            <div className="text-sm font-medium text-gray-700">{triage.hospital.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Arrivée</div>
            <div className="text-sm font-medium text-gray-700">
              Il y a {elapsed < 1 ? "moins d'1 min" : `${elapsed} min`}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card space-y-3">
        <h3 className="font-bold text-gray-900">Actions</h3>
        <Link href="/hopital/recherche" className="btn-primary w-full text-center block">
          Rechercher dans les dossiers patients
        </Link>
        <Link href="/hopital/scan" className="btn-secondary w-full text-center block">
          Scanner un autre QR code
        </Link>
      </div>

      {triage.handledAt && (
        <div className="alert-success text-sm">
          ✓ Pris en charge le {triage.handledAt.toLocaleDateString("fr-FR")}
        </div>
      )}
    </div>
  )
}
