// Informations administratives d'admission (identité, assurance, entourage, situation légale).
// Toutes facultatives : l'urgence passe avant l'administratif, mais il est important de les recueillir
// dès la création du compte pour accélérer l'accueil.

export const ADMIN_KEYS = [
  // identité
  "usageName", "birthPostalCode", "address", "postalCode", "city", "landlinePhone",
  // situation
  "idDocumentType", "employer", "legalStatus", "legalRepName", "legalRepPhone",
  // assurance maladie & mutuelle
  "socialSecurityNumber", "healthFund", "coverageType", "coverageEndDate",
  "mutuelleName", "mutuelleNumber", "mutuelleEndDate", "insuredName", "insuredAddress",
  // médecin traitant / directives
  "treatingDoctorPhone", "advanceDirectives",
  // personne à prévenir
  "ecFirstName", "ecLastName", "ecRelationship", "ecPhone", "ecEmail", "ecAddress",
  // personne de confiance
  "tpFirstName", "tpLastName", "tpRelationship", "tpPhone", "tpEmail", "tpAddress",
] as const

export type AdminKey = (typeof ADMIN_KEYS)[number]
export type AdminInfo = Record<AdminKey, string>

export function emptyAdmin(): AdminInfo {
  return Object.fromEntries(ADMIN_KEYS.map(k => [k, ""])) as AdminInfo
}

export function adminFromFormData(fd: FormData): AdminInfo {
  const a = emptyAdmin()
  for (const k of ADMIN_KEYS) a[k] = ((fd.get(k) as string | null) ?? "").trim()
  return a
}

const n = (s: string) => s.trim() || null
const d = (s: string) => (s.trim() ? new Date(s) : null)

/** Champs à écrire sur Patient. */
export function adminPatientData(a: Partial<AdminInfo>) {
  const g = (k: AdminKey) => a[k] ?? ""
  return {
    usageName: n(g("usageName")),
    birthPostalCode: n(g("birthPostalCode")),
    address: n(g("address")),
    postalCode: n(g("postalCode")),
    city: n(g("city")),
    landlinePhone: n(g("landlinePhone")),
    idDocumentType: n(g("idDocumentType")),
    employer: n(g("employer")),
    legalStatus: n(g("legalStatus")),
    legalRepName: n(g("legalRepName")),
    legalRepPhone: n(g("legalRepPhone")),
    socialSecurityNumber: n(g("socialSecurityNumber")),
    healthFund: n(g("healthFund")),
    coverageType: n(g("coverageType")),
    coverageEndDate: d(g("coverageEndDate")),
    mutuelleName: n(g("mutuelleName")),
    mutuelleNumber: n(g("mutuelleNumber")),
    mutuelleEndDate: d(g("mutuelleEndDate")),
    insuredName: n(g("insuredName")),
    insuredAddress: n(g("insuredAddress")),
  }
}

/** Champs à écrire sur MedicalRecord. */
export function adminRecordData(a: Partial<AdminInfo>) {
  return {
    treatingDoctorPhone: n(a.treatingDoctorPhone ?? ""),
    advanceDirectives: n(a.advanceDirectives ?? ""),
  }
}

type Person = {
  firstName: string
  lastName: string
  relationship: string
  phone: string
  email: string | null
  address: string | null
}

function person(a: Partial<AdminInfo>, p: "ec" | "tp"): Person | null {
  const g = (s: string) => (a[`${p}${s}` as AdminKey] ?? "").trim()
  const firstName = g("FirstName")
  const phone = g("Phone")
  if (!firstName || !phone) return null
  return {
    firstName,
    lastName: g("LastName"),
    relationship: g("Relationship"),
    phone,
    email: n(g("Email")),
    address: n(g("Address")),
  }
}

/** Personne à prévenir (null si prénom ou téléphone manquants). */
export const adminContact = (a: Partial<AdminInfo>) => person(a, "ec")

/** Personne de confiance (null si prénom ou téléphone manquants). */
export const adminTrusted = (a: Partial<AdminInfo>) => person(a, "tp")

/** Valeurs initiales pour les formulaires, depuis un patient + dossier chargés. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adminFromPatient(p: any): AdminInfo {
  const a = emptyAdmin()
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString().split("T")[0] : "")
  for (const k of ADMIN_KEYS) {
    if (k in p && p[k] != null) a[k] = String(p[k])
  }
  a.coverageEndDate = iso(p.coverageEndDate)
  a.mutuelleEndDate = iso(p.mutuelleEndDate)
  const r = p.record
  if (r) {
    a.treatingDoctorPhone = r.treatingDoctorPhone ?? ""
    a.advanceDirectives = r.advanceDirectives ?? ""
    const ec = r.emergencyContact
    if (ec) {
      a.ecFirstName = ec.firstName; a.ecLastName = ec.lastName; a.ecRelationship = ec.relationship
      a.ecPhone = ec.phone; a.ecEmail = ec.email ?? ""; a.ecAddress = ec.address ?? ""
    }
    const tp = r.trustedPerson
    if (tp) {
      a.tpFirstName = tp.firstName; a.tpLastName = tp.lastName; a.tpRelationship = tp.relationship
      a.tpPhone = tp.phone; a.tpEmail = tp.email ?? ""; a.tpAddress = tp.address ?? ""
    }
  }
  return a
}
