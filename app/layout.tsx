import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SAM — Service d'Accès Médical",
  description: "Dossier patient partagé entre établissements",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
<div className="min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
