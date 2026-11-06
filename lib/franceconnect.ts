import bcrypt from "bcryptjs"
import { randomUUID, randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

/**
 * FranceConnect (OpenID Connect) — https://docs.partenaires.franceconnect.gouv.fr/
 * Permet de se connecter avec France Identité, impots.gouv.fr, ameli, La Poste Identité Numérique, etc.
 *
 * Réel : définir FRANCECONNECT_CLIENT_ID, FRANCECONNECT_CLIENT_SECRET (obtenus via DataPass)
 *        et FRANCECONNECT_ISSUER (intégration ou production).
 * Dev  : sans identifiants (et hors production), un fournisseur simulé local est utilisé (/api/dev-idp).
 */

const REAL = !!process.env.FRANCECONNECT_CLIENT_ID && !!process.env.FRANCECONNECT_CLIENT_SECRET
const MOCK = !REAL && process.env.NODE_ENV !== "production"

export const franceConnectMode: "real" | "mock" | "off" = REAL ? "real" : MOCK ? "mock" : "off"
export const franceConnectEnabled = franceConnectMode !== "off"

const appUrl = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export const MOCK_CLIENT_ID = "sam-dev-client"
export const MOCK_CLIENT_SECRET = "sam-dev-secret" // valeur locale factice, sans valeur hors du mode simulé

export function franceConnectIssuer() {
  if (REAL) {
    return process.env.FRANCECONNECT_ISSUER ?? "https://fcp-low.integ01.dev-franceconnect.fr/api/v2"
  }
  return `${appUrl()}/api/dev-idp`
}

export const FRANCECONNECT_SCOPE =
  "openid given_name family_name birthdate gender birthplace birthcountry email preferred_username"

export type FranceConnectClaims = {
  sub: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  birthdate?: string // YYYY-MM-DD
  gender?: string // male | female
  birthplace?: string // code INSEE de la commune
  birthcountry?: string // code INSEE du pays
  email?: string
}

async function cityFromInsee(code?: string): Promise<string> {
  if (!code || !/^\d[0-9AB]\d{3}$/i.test(code)) return ""
  try {
    const res = await fetch(`https://geo.api.gouv.fr/communes/${code}?fields=nom`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return ""
    const data = (await res.json()) as { nom?: string }
    return data.nom ?? ""
  } catch {
    return ""
  }
}

/** Crée (ou retrouve) le compte patient lié à l'identité FranceConnect. */
export async function upsertFranceConnectUser(claims: FranceConnectClaims) {
  const existing = await prisma.user.findUnique({
    where: { franceConnectSub: claims.sub },
    include: { patient: true },
  })
  if (existing?.patient) {
    return {
      id: existing.id,
      email: existing.email,
      role: "PATIENT" as const,
      firstName: existing.patient.firstName,
      lastName: existing.patient.lastName,
    }
  }

  // L'email FranceConnect n'est pas garanti vérifié : on ne rattache jamais à un compte existant par email.
  let email = (claims.email ?? "").trim().toLowerCase()
  if (!email || (await prisma.user.findUnique({ where: { email } }))) {
    email = `fc-${claims.sub.slice(0, 16)}@franceconnect.invalid`
  }

  const firstName = (claims.given_name ?? "").trim().split(/\s+/)[0] ?? ""
  const lastName = (claims.family_name ?? "").trim()
  const gender = claims.gender === "male" ? "HOMME" : claims.gender === "female" ? "FEMME" : null
  const birthCity = await cityFromInsee(claims.birthplace)
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  })

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10), // pas de connexion par mot de passe
      role: "PATIENT",
      franceConnectSub: claims.sub,
      patient: {
        create: {
          firstName,
          lastName,
          birthDate: claims.birthdate ? new Date(claims.birthdate) : new Date(0),
          birthCity,
          birthPostalCode: claims.birthplace ?? null,
          usageName:
            claims.preferred_username && claims.preferred_username !== lastName ? claims.preferred_username : null,
          gender,
          patientNumber: (lastPatient?.patientNumber ?? 0) + 1,
          qrCode: randomUUID(),
          identityVerified: true,
          identityProvider: "FranceConnect",
          identityVerifiedAt: new Date(),
          record: { create: {} },
        },
      },
    },
  })

  return { id: user.id, email: user.email, role: "PATIENT" as const, firstName, lastName }
}

/** Informations obligatoires encore manquantes après FranceConnect (email, lieu de naissance, sexe). */
export function missingIdentityFields(
  user: { email: string },
  patient: { birthCity: string; gender: string | null; birthDate: Date }
) {
  return {
    email: user.email.endsWith("@franceconnect.invalid"),
    birthCity: !patient.birthCity.trim(),
    gender: !patient.gender,
    birthDate: patient.birthDate.getTime() === 0,
  }
}
