import { auth } from "@/auth"
import { redirect } from "next/navigation"
import QrScanner from "./QrScanner"

export default async function ScanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scanner le QR code</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scannez le QR code du patient ou saisissez le code manuellement
        </p>
      </div>
      <QrScanner />
    </div>
  )
}
