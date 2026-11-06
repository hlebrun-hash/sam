import { NextResponse } from "next/server"
import { devIdpEnabled, PERSONAS, signDevToken, verifyDevToken } from "@/lib/dev-idp"

export async function POST(req: Request) {
  if (!devIdpEnabled) return new NextResponse("Not found", { status: 404 })
  const form = await req.formData()
  const err = (e: string) => NextResponse.json({ error: e }, { status: 400 })
  if (form.get("grant_type") !== "authorization_code") return err("unsupported_grant_type")

  let payload
  try {
    payload = await verifyDevToken(String(form.get("code") ?? ""))
  } catch {
    return err("invalid_grant")
  }
  const persona = PERSONAS[String(payload.persona)]
  if (payload.kind !== "code" || !persona || payload.redirect_uri !== form.get("redirect_uri")) return err("invalid_grant")

  const aud = String(payload.aud)
  const idToken = await signDevToken({ sub: persona.claims.sub, nonce: payload.nonce, acr: "eidas1" }, aud, "10m")
  const accessToken = await signDevToken({ kind: "access", persona: String(payload.persona) }, aud, "10m")
  return NextResponse.json(
    { access_token: accessToken, token_type: "Bearer", expires_in: 600, id_token: idToken },
    { headers: { "cache-control": "no-store" } }
  )
}
