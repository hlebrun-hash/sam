import { NextResponse } from "next/server"
import { devIdpEnabled } from "@/lib/dev-idp"
import { franceConnectIssuer } from "@/lib/franceconnect"

export async function GET() {
  if (!devIdpEnabled) return new NextResponse("Not found", { status: 404 })
  const iss = franceConnectIssuer()
  return NextResponse.json({
    issuer: iss,
    authorization_endpoint: `${iss}/authorize`,
    token_endpoint: `${iss}/token`,
    userinfo_endpoint: `${iss}/userinfo`,
    jwks_uri: `${iss}/jwks`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    scopes_supported: ["openid", "given_name", "family_name", "birthdate", "gender", "birthplace", "birthcountry", "email"],
  })
}
