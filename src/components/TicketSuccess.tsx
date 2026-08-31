'use client'

import React, { useState } from 'react'
import { Trip, PassengerData } from '@/types/trip'
import { Icon } from './Icon'

interface TicketSuccessProps {
  trip: Trip
  seats: number[]
  passenger: PassengerData
  bookingCode: string
}

export function TicketSuccess({
  trip,
  seats,
  passenger,
  bookingCode,
}: TicketSuccessProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="success" role="status">
      <div className="success-icon" aria-hidden="true">
        <Icon name="check" size={31} />
      </div>

      <span className="eyebrow red">Pemesanan berhasil</span>
      <h4>Sampai jumpa di perjalanan!</h4>
      <p>
        E-ticket sudah aktif. Tunjukkan kode booking ini kepada petugas saat
        keberangkatan.
      </p>

      <div className="ticket" aria-label="Detail E-Ticket">
        <div className="ticket-header">
          <span>Kode booking</span>
          <button
            type="button"
            className="ticket-copy-btn"
            onClick={handleCopyCode}
            aria-label="Salin kode booking ke clipboard"
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            <small>{copied ? 'Tersalin!' : 'Salin Kode'}</small>
          </button>
        </div>

        <strong>{bookingCode}</strong>

        <div className="ticket-details">
          <div>
            <small>Nama Penumpang</small>
            <b>{passenger.fullName}</b>
          </div>
          <div>
            <small>Keberangkatan</small>
            <b>
              {trip.departureTime} {trip.timeZone} · Kursi {seats.join(', ')}
            </b>
          </div>
        </div>

        <div className="ticket-route">
          <div className="ticket-point">
            <small>Titik Jemput</small>
            <p>{trip.departurePoint}</p>
          </div>
          <div className="ticket-point">
            <small>Titik Tiba</small>
            <p>{trip.arrivalPoint}</p>
          </div>
        </div>
      </div>

      <div className="ticket-actions">
        <button
          type="button"
          className="ticket-action-btn"
          onClick={handlePrint}
          aria-label="Cetak atau simpan tiket sebagai PDF"
        >
          <Icon name="download" size={16} />
          <span>Simpan / Cetak E-Ticket</span>
        </button>
      </div>
    </div>
  )
}
