import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardPath } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

export default async function RedirectByRolePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  redirect(getDashboardPath(session.user.role as Role))
}
