import { NextResponse } from "next/server"
import { devIdpEnabled, PERSONAS, signDevToken } from "@/lib/dev-idp"

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
const esc = (s: string) => s.replace(/[&<>"']/g, c => ESC[c])

export async function GET(req: Request) {
  if (!devIdpEnabled) return new NextResponse("Not found", { status: 404 })
  const url = new URL(req.url)
  const q = url.searchParams
  const redirectUri = q.get("redirect_uri") ?? ""
  const state = q.get("state") ?? ""
  const nonce = q.get("nonce") ?? ""
  const clientId = q.get("client_id") ?? ""

  // La redirection ne doit aller que vers l'application locale.
  let target: URL
  try { target = new URL(redirectUri) } catch { return new NextResponse("redirect_uri invalide", { status: 400 }) }
  const appOrigin = new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000").origin
  if (target.origin !== appOrigin && target.hostname !== "localhost") {
    return new NextResponse("redirect_uri non autorisée", { status: 400 })
  }

  const persona = q.get("persona")
  if (persona && PERSONAS[persona]) {
    const code = await signDevToken({ persona, nonce, redirect_uri: redirectUri, kind: "code" }, clientId, "2m")
    target.searchParams.set("code", code)
    if (state) target.searchParams.set("state", state)
    return NextResponse.redirect(target)
  }

  const links = Object.entries(PERSONAS)
    .map(([id, p]) => {
      const next = new URL(url)
      next.searchParams.set("persona", id)
      return `<a class="p" href="${esc(next.pathname + next.search)}"><b>${esc(p.label)}</b><span>via ${esc(p.via)}</span><small>${esc(p.note)}</small></a>`
    })
    .join("")

  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FranceConnect (simulé)</title>
<style>body{font-family:system-ui,sans-serif;background:#f3f4f6;margin:0;display:grid;place-items:center;min-height:100vh}
.box{background:#fff;max-width:420px;width:calc(100% - 32px);border-radius:16px;padding:24px;box-shadow:0 4px 20px #0001}
h1{font-size:18px;margin:0 0 4px;color:#003189}p{color:#6b7280;font-size:13px;margin:0 0 16px}
.p{display:block;border:2px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin-bottom:10px;text-decoration:none;color:#111}
.p:hover{border-color:#003189}.p b{display:block}.p span{font-size:13px;color:#003189}.p small{display:block;color:#6b7280;margin-top:2px}
.w{background:#fef3c7;color:#92400e;border-radius:8px;padding:8px 10px;font-size:12px;margin-bottom:14px}</style>
<div class="box"><h1>FranceConnect — simulation</h1>
<div class="w">Environnement de développement : fournisseur d'identité factice. Aucune vraie authentification.</div>
<p>Choisissez l'identité avec laquelle vous souhaitez vous connecter :</p>${links}</div></html>`
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } })
}
