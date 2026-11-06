import Fuse from "fuse.js"

export type SearchablePatient = {
  id: string
  firstName: string
  lastName: string
  birthDate: Date | string
  birthCity: string
  photoUrl: string | null
  bloodGroup: string | null
  validatedAt: Date | string | null
}

export function searchPatients(
  patients: SearchablePatient[],
  query: { firstName: string; lastName: string; birthDate?: string; birthCity?: string }
): SearchablePatient[] {
  if (!query.firstName && !query.lastName) return []

  const fuse = new Fuse(patients, {
    keys: [
      { name: "lastName", weight: 0.4 },
      { name: "firstName", weight: 0.4 },
      { name: "birthCity", weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: false,
  })

  const searchTerm = `${query.lastName} ${query.firstName}`.trim()
  let results = fuse.search(searchTerm).map((r) => r.item)

  if (query.birthDate) {
    const targetDate = query.birthDate
    results = results.filter((p) => {
      const bd = typeof p.birthDate === "string" ? p.birthDate : p.birthDate.toISOString()
      return bd.startsWith(targetDate)
    })
  }

  if (query.birthCity) {
    const city = normalizeText(query.birthCity)
    results = results.filter((p) => normalizeText(p.birthCity).includes(city))
  }

  return results
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}
