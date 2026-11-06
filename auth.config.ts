import type { NextAuthConfig } from "next-auth"
import type { Role } from "@/lib/permissions"

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    session({ session, token }) {
      if (token.role) (session.user as any).role = token.role
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const session = auth
      const { pathname } = nextUrl

      const publicPaths = ["/login", "/register", "/api/auth", "/triage", "/api/triage"]
      if (pathname === "/" || publicPaths.some((p) => pathname.startsWith(p))) {
        return true
      }

      if (!session?.user) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      const role = session.user.role as Role

      if ((pathname.startsWith("/hopital") || pathname.startsWith("/admin")) && role === "PATIENT") {
        return Response.redirect(new URL("/patient/dashboard", nextUrl))
      }

      if (pathname.startsWith("/patient") && role !== "PATIENT") {
        if (role === "ADMIN_HOPITAL") return Response.redirect(new URL("/admin/dashboard", nextUrl))
        return Response.redirect(new URL("/hopital/dashboard", nextUrl))
      }

      if (pathname.startsWith("/admin") && role !== "ADMIN_HOPITAL") {
        return Response.redirect(new URL("/hopital/dashboard", nextUrl))
      }

      return true
    },
  },
  session: { strategy: "jwt" },
}
