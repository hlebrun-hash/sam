import Link from "next/link"
import { auth } from "@/auth"
import { ROLE_LABELS } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"
import Avatar from "./Avatar"
import SignOutButton from "./SignOutButton"

type NavItem = { href: string; label: string; icon: React.ReactNode }

type NavBarProps = {
  items: NavItem[]
  accentColor?: string
}

export default async function NavBar({ items, accentColor = "blue" }: NavBarProps) {
  const session = await auth()
  if (!session?.user) return null

  const user = session.user
  const firstName = user.firstName ?? ""
  const lastName = user.lastName ?? ""

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-blue-900 text-lg hidden sm:block">SAM</span>
          </div>

          {/* Nav items */}
          <nav className="flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition min-h-touch"
              >
                {item.icon}
                <span className="hidden md:block">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-gray-900">
                {firstName} {lastName}
              </span>
              <span className="text-xs text-gray-500">
                {ROLE_LABELS[user.role as Role]}
                {user.hospitalName ? ` — ${user.hospitalName}` : ""}
              </span>
            </div>
            <Avatar firstName={firstName || "?"} lastName={lastName || "?"} size="sm" />
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
