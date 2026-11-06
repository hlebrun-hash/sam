export type HospitalForRouting = {
  id: string
  name: string
  type: string
  city: string
  address: string | null
  phone: string | null
  bedCount: number
  lat: number | null
  lng: number | null
}

export type ScoredHospital = HospitalForRouting & {
  distanceKm: number
  score: number
  affluenceScore: number
  recommended?: boolean
  recommendReason?: string
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Score d'affluence simulé, déterministe par établissement ─────────────────

export function getAffluenceScore(id: string): number {
  let n = 0
  for (let i = 0; i < id.length; i++) n = ((n << 5) - n + id.charCodeAt(i)) | 0
  n = Math.abs(n)
  const hour = new Date().getHours()
  const isPeak = (hour >= 9 && hour <= 12) || (hour >= 17 && hour <= 21)
  const base = (n % 68) + 8
  return Math.min(97, isPeak ? base + 18 : base)
}

// ── Pénalité de type selon le motif ─────────────────────────────────────────
// Valeur positive = mauvaise correspondance (monte le score, donc moins bon)
// Valeur négative = bonne correspondance (baisse le score, donc mieux classé)

function typeMatchPenalty(hospitalType: string, complaint: string, urgency: string): number {
  if (urgency === "CRITIQUE") return 0 // On ne filtre pas pour une urgence vitale

  const t = hospitalType.toLowerCase()
  const isClinic = t.includes("clinique") || t.includes("privé") || t.includes("prive")
  const isCHU    = t.includes("chu") || t.includes("ap-hp") || t.startsWith("ap")

  if (urgency === "MODEREE") {
    const minorComplaints = ["Plaie", "Fièvre", "Douleur abdominale", "Autre", "Douleur intense"]
    if (minorComplaints.includes(complaint)) {
      if (isClinic) return -20  // Clinique idéale pour motif mineur
      if (isCHU)    return +50  // CHU surchargé, inadapté pour motif mineur
    }
  }

  if (urgency === "HAUTE" && complaint === "Fracture") {
    if (isClinic) return -10    // Clinique orthopédique bien adaptée
    if (isCHU)    return +15    // CHU moins adapté pour traumatologie courante
  }

  return 0
}

function buildRecommendReason(
  h: HospitalForRouting,
  complaint: string,
  urgency: string,
  affluence: number,
  isGeoFirst: boolean
): string | undefined {
  const t = h.type.toLowerCase()
  const isClinic = t.includes("clinique") || t.includes("privé") || t.includes("prive")

  if (urgency === "CRITIQUE") return "Le plus proche — urgence vitale"

  const reasons: string[] = []

  if (urgency === "MODEREE") {
    const minorComplaints = ["Plaie", "Fièvre", "Douleur abdominale", "Autre", "Douleur intense"]
    if (minorComplaints.includes(complaint) && isClinic) {
      reasons.push("Adapté à votre motif")
    }
  }
  if (complaint === "Fracture" && (isClinic || h.type === "CH")) {
    reasons.push("Adapté à votre motif")
  }

  if (affluence < 45)       reasons.push("Peu d'attente")
  else if (affluence < 65)  reasons.push("Attente modérée")

  if (!isGeoFirst && reasons.length === 0) reasons.push("Meilleur rapport distance/affluence")

  return reasons.length > 0 ? reasons.join(" · ") : undefined
}

// ── Classement intelligent ───────────────────────────────────────────────────

export function rankHospitals(
  userLat: number,
  userLng: number,
  hospitals: HospitalForRouting[],
  complaint = "",
  urgency = "MODEREE"
): ScoredHospital[] {
  const scored = hospitals
    .map((h) => {
      const distanceKm =
        h.lat != null && h.lng != null
          ? haversineKm(userLat, userLng, h.lat, h.lng)
          : 999
      const affluenceScore = getAffluenceScore(h.id)
      const penalty        = typeMatchPenalty(h.type, complaint, urgency)

      let score: number
      if (urgency === "CRITIQUE") {
        score = distanceKm * 10
      } else if (urgency === "HAUTE") {
        score = distanceKm * 5 + affluenceScore * 0.4 + penalty
      } else {
        // MODEREE : on déprioritise fortement les établissements surchargés ou inadaptés
        score = distanceKm * 2.5 + affluenceScore * 0.6 + penalty
      }

      return { ...h, distanceKm, score, affluenceScore } as ScoredHospital
    })
    .sort((a, b) => a.score - b.score)

  if (scored.length === 0) return scored

  // Identifier le plus proche géographiquement (avant tri)
  const closestByDistance = [...scored].sort((a, b) => a.distanceKm - b.distanceKm)[0]
  const recommended = scored[0]
  const isGeoFirst = recommended.id === closestByDistance.id

  // Marquer le recommandé
  scored[0] = {
    ...recommended,
    recommended: true,
    recommendReason: buildRecommendReason(
      recommended, complaint, urgency, recommended.affluenceScore, isGeoFirst
    ),
  }

  return scored
}
