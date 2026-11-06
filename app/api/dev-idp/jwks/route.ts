import { NextResponse } from "next/server"
import { devIdpEnabled, devIdpKeys } from "@/lib/dev-idp"

export async function GET() {
  if (!devIdpEnabled) return new NextResponse("Not found", { status: 404 })
  const { publicJwk } = await devIdpKeys()
  return NextResponse.json({ keys: [publicJwk] })
}
