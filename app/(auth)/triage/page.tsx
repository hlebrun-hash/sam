import { prisma } from "@/lib/prisma"
import TriageForm from "./TriageForm"
import type { HospitalForRouting } from "@/lib/hospital-routing"

export default async function TriagePage() {
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true, type: true, city: true, address: true, phone: true, bedCount: true, lat: true, lng: true },
    orderBy: { name: "asc" },
  })

  const hospitalsForRouting: HospitalForRouting[] = hospitals

  return <TriageForm hospitals={hospitalsForRouting} />
}
