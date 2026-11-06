// Fournisseur d'identité OIDC SIMULÉ, pour développer sans identifiants FranceConnect.
// Désactivé en production. Jamais à utiliser comme vraie authentification.
import { generateKeyPair, exportJWK, SignJWT, jwtVerify, importJWK, type JWK, type CryptoKey } from "jose"
import { franceConnectIssuer, MOCK_CLIENT_ID, type FranceConnectClaims } from "@/lib/franceconnect"

type Keys = { privateKey: CryptoKey; publicJwk: JWK }
const g = globalThis as unknown as { __devIdpKeys?: Promise<Keys> }

export function devIdpKeys(): Promise<Keys> {
  g.__devIdpKeys ??= (async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true })
    const publicJwk = await exportJWK(publicKey)
    return { privateKey, publicJwk: { ...publicJwk, alg: "RS256", use: "sig", kid: "dev-idp" } }
  })()
  return g.__devIdpKeys
}

export const devIdpEnabled = process.env.NODE_ENV !== "production" && !process.env.FRANCECONNECT_CLIENT_ID

export const PERSONAS: Record<string, { label: string; via: string; note: string; claims: FranceConnectClaims }> = {
  complet: {
    label: "Camille DURAND",
    via: "France Identité",
    note: "Toutes les informations sont fournies",
    claims: {
      sub: "fc-sub-camille-durand-0001",
      given_name: "Camille Anne",
      family_name: "DURAND",
      birthdate: "1989-03-14",
      gender: "female",
      birthplace: "75056",
      birthcountry: "99100",
      email: "camille.durand@example.fr",
    },
  },
  incomplet: {
    label: "Léo BERNARD",
    via: "impots.gouv.fr",
    note: "Sans email, sans sexe ni lieu de naissance (informations manquantes)",
    claims: {
      sub: "fc-sub-leo-bernard-0002",
      given_name: "Léo",
      family_name: "BERNARD",
      birthdate: "1995-11-02",
    },
  },
}

export async function signDevToken(payload: Record<string, unknown>, aud: string, ttl: string) {
  const { privateKey } = await devIdpKeys()
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: "dev-idp" })
    .setIssuer(franceConnectIssuer())
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(privateKey)
}

export async function verifyDevToken(token: string) {
  const { publicJwk } = await devIdpKeys()
  const key = await importJWK(publicJwk, "RS256")
  const { payload } = await jwtVerify(token, key, { issuer: franceConnectIssuer() })
  return payload
}

export { MOCK_CLIENT_ID }
