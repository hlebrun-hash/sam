import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDateTime } from "@/lib/utils"

const ACTION_LABELS: Record<string, string> = {
  EMERGENCY_ACCESS: "Bris de glace",
  VALIDATE_RECORD: "Validation dossier",
  REGISTER_VISIT: "Passage enregistré",
}

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_HOPITAL") redirect("/admin/dashboard")

  const hospitalId = session.user.hospitalId!

  const logs = await prisma.auditLog.findMany({
    where: { hospitalId },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      staff: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const emergencyCount = logs.filter((l) => l.isEmergency).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;audit</h1>
        <p className="text-gray-500 text-sm mt-1">
          {logs.length} événement(s) — {emergencyCount} accès d&apos;urgence
        </p>
      </div>

      {emergencyCount > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-red-800 font-semibold">
            ⚠ {emergencyCount} accès d&apos;urgence (bris de glace) enregistré(s)
          </p>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Agent</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Patient</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                    Aucun événement enregistré
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className={log.isEmergency ? "bg-red-50" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        log.isEmergency
                          ? "bg-red-600 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.staff?.firstName} {log.staff?.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.patient?.firstName} {log.patient?.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
