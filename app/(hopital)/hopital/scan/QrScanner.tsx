"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type Tab = "camera" | "qrcode" | "number"

export default function QrScanner() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("camera")
  const [manualCode, setManualCode] = useState("")
  const [patientNum, setPatientNum] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<unknown>(null)

  async function lookupCode(raw: string) {
    if (raw.startsWith("TRIAGE:")) {
      const triageId = raw.slice(7).trim()
      if (triageId) { router.push(`/hopital/triage/${triageId}`); return }
    }
    const code = raw.startsWith("SAM:") ? raw.slice(4) : raw
    if (!code.trim()) { setError("Code invalide"); return }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/patient-by-qr?code=${encodeURIComponent(code.trim())}`)
      if (!res.ok) { setError("Patient introuvable. Vérifiez le code."); setLoading(false); return }
      const { patientId, redirectTo } = await res.json() as { patientId: string; redirectTo?: string }
      router.push(redirectTo ?? `/hopital/patient/${patientId}`)
    } catch {
      setError("Erreur réseau. Réessayez.")
      setLoading(false)
    }
  }

  async function lookupNumber() {
    const raw = patientNum.trim()
    if (!raw) { setError("Saisissez un numéro patient."); return }
    await lookupCode(raw)
  }

  async function startCamera() {
    setScanning(true)
    setError(null)
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-scanner-region")
      html5QrRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop()
          setScanning(false)
          html5QrRef.current = null
          await lookupCode(decodedText)
        },
        undefined
      )
    } catch {
      setScanning(false)
      setError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.")
    }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try { await (html5QrRef.current as { stop: () => Promise<void> }).stop() } catch { /* ignore */ }
      html5QrRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        (html5QrRef.current as { stop: () => Promise<void> }).stop().catch(() => undefined)
      }
    }
  }, [])

  // Stop camera when switching away from camera tab
  useEffect(() => {
    if (tab !== "camera" && scanning) {
      if (html5QrRef.current) {
        (html5QrRef.current as { stop: () => Promise<void> }).stop().catch(() => undefined)
        html5QrRef.current = null
      }
      setScanning(false)
    }
  }, [tab, scanning])

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "camera",  label: "Caméra",        icon: "📷" },
    { id: "qrcode",  label: "Code QR",        icon: "🔳" },
    { id: "number",  label: "N° Patient",     icon: "🔢" },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Camera ── */}
      {tab === "camera" && (
        <div className="card">
          {!scanning ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-4">
                Pointez la caméra vers le QR code du patient affiché sur son téléphone.
              </p>
              <button onClick={startCamera} className="btn-primary flex items-center justify-center gap-2 mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Activer la caméra
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div id="qr-scanner-region" ref={scannerRef} className="rounded-xl overflow-hidden" />
              <button onClick={stopCamera} className="btn-secondary w-full">Arrêter la caméra</button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Manual QR code ── */}
      {tab === "qrcode" && (
        <div className="card space-y-3">
          <p className="text-sm text-gray-500">
            Saisissez le code QR complet affiché sur le téléphone du patient (format <code className="bg-gray-100 px-1 rounded text-xs">SAM:…</code>).
          </p>
          <form
            onSubmit={e => { e.preventDefault(); lookupCode(manualCode) }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="SAM:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input-field flex-1 font-mono text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {loading ? "…" : "Ouvrir"}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab: Patient number ── */}
      {tab === "number" && (
        <div className="card space-y-3">
          <p className="text-sm text-gray-500">
            Saisissez le numéro patient (ex&nbsp;: <code className="bg-gray-100 px-1 rounded text-xs">P-00042</code> ou simplement <code className="bg-gray-100 px-1 rounded text-xs">42</code>).
          </p>
          <form
            onSubmit={e => { e.preventDefault(); lookupNumber() }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={patientNum}
              onChange={e => setPatientNum(e.target.value)}
              placeholder="P-00001"
              className="input-field flex-1 font-mono text-lg tracking-widest text-center"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !patientNum.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {loading ? "…" : "Rechercher"}
            </button>
          </form>
          <p className="text-xs text-gray-400">
            Ce numéro se trouve sur la carte patient ou dans son dossier papier.
          </p>
        </div>
      )}

      {error && (
        <div className="alert-warning">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
