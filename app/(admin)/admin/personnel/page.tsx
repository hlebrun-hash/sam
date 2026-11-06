import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROLE_LABELS } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import Avatar from "@/components/Avatar"
import AddStaffForm from "./AddStaffForm"

export default async function PersonnelPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_HOPITAL") redirect("/admin/dashboard")

  const hospitalId = session.user.hospitalId!

  const staff = await prisma.staff.findMany({
    where: { hospitalId },
    include: { user: { select: { email: true, role: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { name: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du personnel</h1>
          <p className="text-gray-500 text-sm mt-1">{hospital?.name} — {staff.length} membre(s)</p>
        </div>
      </div>

      {/* Staff list */}
      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pb-3 text-gray-500 font-medium">Membre</th>
              <th className="text-left pb-3 text-gray-500 font-medium">Rôle</th>
              <th className="text-left pb-3 text-gray-500 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={s.firstName} lastName={s.lastName} size="sm" />
                    <span className="font-medium text-gray-900">
                      {s.firstName} {s.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    {ROLE_LABELS[s.user.role as Role] ?? s.user.role}
                  </span>
                </td>
                <td className="py-3 text-gray-600">{s.user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add staff form */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Ajouter un membre</h2>
        <AddStaffForm hospitalId={hospitalId} />
      </div>
    </div>
  )
}
