"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

type Props = { token: string }

export default function QrCodeDisplay({ token }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `SAM:${token}`, {
        width: 240,
        margin: 2,
        color: { dark: "#1d4ed8", light: "#ffffff" },
      })
    }
  }, [token])

  return (
    <div className="flex justify-center my-4">
      <canvas ref={canvasRef} className="rounded-xl shadow-md" />
    </div>
  )
}
