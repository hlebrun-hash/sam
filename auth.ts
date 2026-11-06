import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Role } from "@/lib/permissions"
import { authConfig } from "./auth.config"
import { decodeJwt } from "jose"
import {
  franceConnectEnabled, franceConnectMode, franceConnectIssuer, FRANCECONNECT_SCOPE,
  MOCK_CLIENT_ID, MOCK_CLIENT_SECRET, upsertFranceConnectUser, type FranceConnectClaims,
} from "@/lib/franceconnect"

// FranceConnect : connexion via France Identité, impots.gouv.fr, ameli, La Poste, etc.
const franceConnect = {
  id: "franceconnect",
  name: "FranceConnect",
  type: "oidc" as const,
  issuer: franceConnectIssuer(),
  clientId: franceConnectMode === "real" ? process.env.FRANCECONNECT_CLIENT_ID : MOCK_CLIENT_ID,
  clientSecret: franceConnectMode === "real" ? process.env.FRANCECONNECT_CLIENT_SECRET : MOCK_CLIENT_SECRET,
  checks: ["state", "nonce"] as ("state" | "nonce")[],
  authorization: { params: { scope: FRANCECONNECT_SCOPE, acr_values: "eidas1" } },
  client: {
    token_endpoint_auth_method: "client_secret_post" as const,
    id_token_signed_response_alg: process.env.FRANCECONNECT_ID_TOKEN_ALG ?? "RS256",
  },
  // Le id_token ne contient que `sub` : l'état civil vient de /userinfo, renvoyé sous forme de JWT signé.
  async profile(idClaims: { sub: string }, tokens: { access_token?: string }) {
    const conf = await fetch(`${franceConnectIssuer()}/.well-known/openid-configuration`).then(r => r.json())
    const res = await fetch(conf.userinfo_endpoint, { headers: { Authorization: `Bearer ${tokens.access_token}` } })
    if (!res.ok) throw new Error(`FranceConnect userinfo ${res.status}`)
    const text = await res.text()
    let info: FranceConnectClaims
    try { info = JSON.parse(text) } catch { info = decodeJwt(text) as unknown as FranceConnectClaims }
    if (info.sub !== idClaims.sub) throw new Error("FranceConnect: sub incohérent entre id_token et userinfo")

    const u = await upsertFranceConnectUser(info)
    // Auth.js remplace `id` par un UUID pour les connexions OAuth : on garde l'identifiant en base dans `userId`.
    return { ...u, userId: u.id, name: `${u.firstName} ${u.lastName}` }
  },
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      staffId?: string
      hospitalId?: string
      hospitalName?: string
      firstName?: string
      lastName?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    staffId?: string
    hospitalId?: string
    hospitalName?: string
    firstName?: string
    lastName?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...(franceConnectEnabled ? [franceConnect] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            patient: true,
            staff: { include: { hospital: true } },
          },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!isValid) return null

        const baseUser = {
          id: user.id,
          email: user.email,
          role: user.role as Role,
        }

        if (user.staff) {
          return {
            ...baseUser,
            staffId: user.staff.id,
            hospitalId: user.staff.hospitalId,
            hospitalName: user.staff.hospital.name,
            firstName: user.staff.firstName,
            lastName: user.staff.lastName,
          }
        }

        if (user.patient) {
          return {
            ...baseUser,
            firstName: user.patient.firstName,
            lastName: user.patient.lastName,
          }
        }

        return baseUser
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = (user as any).userId ?? user.id
        token.role = user.role
        token.staffId = (user as any).staffId
        token.hospitalId = (user as any).hospitalId
        token.hospitalName = (user as any).hospitalName
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as Role
      session.user.staffId = token.staffId as string | undefined
      session.user.hospitalId = token.hospitalId as string | undefined
      session.user.hospitalName = token.hospitalName as string | undefined
      session.user.firstName = token.firstName as string | undefined
      session.user.lastName = token.lastName as string | undefined
      return session
    },
  },
})
