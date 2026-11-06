import Fuse from "fuse.js"

type Patient = {
  id: string
  firstName: string
  lastName: string
  birthCity: string
  birthDate: string
}

const PATIENTS: Patient[] = [
  { id: "1", firstName: "Jean", lastName: "Dupont", birthCity: "Lyon", birthDate: "1978-03-14T00:00:00.000Z" },
  { id: "2", firstName: "Marie", lastName: "Dupont", birthCity: "Paris", birthDate: "1985-06-20T00:00:00.000Z" },
  { id: "3", firstName: "Sophie", lastName: "Martin", birthCity: "Marseille", birthDate: "1990-01-01T00:00:00.000Z" },
  { id: "4", firstName: "François", lastName: "Renard", birthCity: "Évreux", birthDate: "1965-12-05T00:00:00.000Z" },
]

function makeSearch(patients: Patient[]) {
  return new Fuse(patients, {
    keys: ["lastName", "firstName", "birthCity"],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
  })
}

describe("Patient fuzzy search", () => {
  it("finds exact match by last name", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Dupont")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.map((r) => r.item.lastName)).toEqual(expect.arrayContaining(["Dupont"]))
  })

  it("detects homonyms (multiple patients with same last name)", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Dupont")
    expect(results.length).toBe(2)
  })

  it("finds by first name", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Sophie")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].item.firstName).toBe("Sophie")
  })

  it("finds by birth city", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Marseille")
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].item.birthCity).toBe("Marseille")
  })

  it("handles typos via fuzzy threshold", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Dupond") // typo: d instead of t
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it("handles accented city names", () => {
    const fuse = makeSearch(PATIENTS)
    const results = fuse.search("Evreux") // missing accent
    // Fuse.js should still find Évreux
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it("returns no results for empty query (guard clause pattern)", () => {
    const fuse = makeSearch(PATIENTS)
    const query = ""
    const results = query.trim() ? fuse.search(query) : []
    expect(results).toHaveLength(0)
  })
})
