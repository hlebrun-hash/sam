import { NextResponse } from "next/server"
import { devIdpEnabled, PERSONAS, signDevToken, verifyDevToken } from "@/lib/dev-idp"

// Comme FranceConnect, /userinfo renvoie un JWT signé (et non du JSON).
export async function GET(req: Request) {
  if (!devIdpEnabled) return new NextResponse("Not found", { status: 404 })
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "")
  try {
    const payload = await verifyDevToken(token)
    const persona = PERSONAS[String(payload.persona)]
    if (payload.kind !== "access" || !persona) throw new Error("bad token")
    const jwt = await signDevToken({ ...persona.claims }, String(payload.aud), "5m")
    return new NextResponse(jwt, { headers: { "content-type": "application/jwt", "cache-control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 })
  }
}
