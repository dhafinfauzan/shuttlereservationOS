'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Trip } from '@/types/trip'
import { formatRupiah } from '@/lib/utils'

interface DummyPaymentProps {
  trip: Trip
  seats: number[]
  heldUntil: number | null
  onExpire?: () => void
}

export function DummyPayment({ trip, seats, heldUntil, onExpire }: DummyPaymentProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!heldUntil) return 600
    const diff = Math.max(0, Math.floor((heldUntil - Date.now()) / 1000))
    return diff
  })

  useEffect(() => {
    if (!heldUntil) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((heldUntil - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        if (onExpire) onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [heldUntil, onExpire])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  // Generate deterministic QR pattern
  const cells = useMemo(() => {
    return Array.from({ length: 225 }, (_, i) => {
      // Corners
      const row = Math.floor(i / 15)
      const col = i % 15

      // Top-left finder
      if (row < 5 && col < 5) return row === 0 || row === 4 || col === 0 || col === 4 || (row === 2 && col === 2)
      // Top-right finder
      if (row < 5 && col > 9) return row === 0 || row === 4 || col === 10 || col === 14 || (row === 2 && col === 12)
      // Bottom-left finder
      if (row > 9 && col < 5) return row === 10 || row === 14 || col === 0 || col === 4 || (row === 12 && col === 2)

      // Pseudorandom internal pattern
      return (i * 17 + i * i * 3 + 11) % 7 < 3
    })
  }, [])

  return (
    <div className="payment">
      <div className="dummy-badge" role="status">
        SIMULASI · TIDAK ADA TRANSAKSI
      </div>

      <h4>Scan QRIS untuk membayar</h4>
      <p className="muted">
        Selesaikan pembayaran dalam waktu <b style={{ color: 'var(--red)' }}>{minutes}:{seconds}</b>
      </p>

      <div
        className="qr"
        role="img"
        aria-label="Kode QRIS simulasi pembayaran"
      >
        {cells.map((dark, i) => (
          <i key={i} className={dark ? 'dark' : ''} aria-hidden="true" />
        ))}
      </div>

      <div className="payment-summary">
        <div className="pay-row">
          <span>Rincian rute</span>
          <span>
            {trip.from} → {trip.to} (Kursi {seats.join(', ')})
          </span>
        </div>
        <div className="pay-row">
          <span>Biaya tiket</span>
          <span>{seats.length} × {formatRupiah(trip.price)}</span>
        </div>
        <div className="pay-row">
          <span>Biaya layanan / admin</span>
          <span style={{ color: '#2d7145', fontWeight: 600 }}>Rp 0 (Gratis)</span>
        </div>
        <div className="pay-total">
          <span>Total pembayaran</span>
          <strong>{formatRupiah(trip.price * seats.length)}</strong>
        </div>
      </div>
    </div>
  )
}
