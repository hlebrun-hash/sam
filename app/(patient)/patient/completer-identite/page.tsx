import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { missingIdentityFields } from "@/lib/franceconnect"
import CompleteIdentityForm from "./CompleteIdentityForm"

export default async function CompleteIdentityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } })
  if (!user?.patient) redirect("/login")

  const missing = missingIdentityFields(user, user.patient)
  const p = user.patient

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complétez votre identité</h1>
        <p className="text-gray-500 text-sm mt-1">
          Votre identité a été vérifiée via {p.identityProvider ?? "un service de l'État"}, mais certaines
          informations n&apos;ont pas été transmises. Merci de les renseigner.
        </p>
      </div>

      <div className="card bg-green-50 border-green-200 flex items-center gap-3">
        <span className="text-xl">✅</span>
        <div className="text-sm">
          <p className="font-semibold text-green-900">{p.firstName} {p.lastName}</p>
          <p className="text-green-700">Identité certifiée — ces champs ne sont pas modifiables.</p>
        </div>
      </div>

      <CompleteIdentityForm missing={missing} />
    </div>
  )
}
