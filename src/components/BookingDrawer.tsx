'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Trip, BookingStep, BookingStatus, PassengerData } from '@/types/trip'
import { formatRupiah } from '@/lib/utils'
import { passengerFormSchema } from '@/lib/schemas'
import { BookingResult, createBooking, simulatePayment } from '@/lib/api'
import { Icon } from './Icon'
import { SeatPicker } from './SeatPicker'
import { PassengerForm } from './PassengerForm'
import { DummyPayment } from './DummyPayment'
import { TicketSuccess } from './TicketSuccess'

interface BookingDrawerProps {
  route: Trip | null
  passengerCount: number
  onClose: () => void
}

const STEPS = ['Kursi', 'Data', 'Bayar', 'Tiket'] as const

export function BookingDrawer({ route, passengerCount, onClose }: BookingDrawerProps) {
  const [step, setStep] = useState<BookingStep>(1)
  const [seats, setSeats] = useState<number[]>(() => {
    if (!route) return []
    return Array.from({ length: route.totalSeats }, (_, index) => index + 1)
      .filter((seat) => !route.occupiedSeats.includes(seat))
      .slice(0, passengerCount)
  })
  const [passenger, setPassenger] = useState<PassengerData>({ fullName: '', whatsapp: '', email: '' })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PassengerData, string>>>({})
  const [status, setStatus] = useState<BookingStatus>('draft')
  const [heldUntil, setHeldUntil] = useState<number | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab' || !drawerRef.current) return
    const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (!route) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [route, handleKeyDown])

  if (!route) return null

  const handleNext = async () => {
    setSubmitError(null)
    if (step === 1) {
      if (seats.length === passengerCount) setStep(2)
      return
    }
    if (step === 2) {
      const parsed = passengerFormSchema.safeParse(passenger)
      if (!parsed.success) {
        const errors: Partial<Record<keyof PassengerData, string>> = {}
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof PassengerData
          if (field) errors[field] = issue.message
        })
        setFormErrors(errors)
        return
      }
      setFormErrors({})
      setIsSubmitting(true)
      try {
        const created = await createBooking(route.id, seats, parsed.data)
        setBooking(created)
        setHeldUntil(new Date(created.heldExpiresAt).getTime())
        setStatus('waiting_payment')
        setStep(3)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Pemesanan gagal dibuat')
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    if (step === 3 && booking) {
      setIsSubmitting(true)
      try {
        await simulatePayment(booking)
        setStatus('paid')
        setStep(4)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Konfirmasi pembayaran gagal')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const restart = () => {
    setStatus('draft')
    setStep(1)
    setHeldUntil(null)
    setBooking(null)
    setSubmitError(null)
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="drawer-trip-title"
      onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="drawer" ref={drawerRef}>
        <button ref={closeButtonRef} type="button" className="drawer-close" onClick={onClose} aria-label="Tutup jendela pemesanan">
          <Icon name="close" size={20} />
        </button>
        <div className="drawer-top">
          <span className="eyebrow red">Kelana Nova</span>
          <h3 id="drawer-trip-title">{route.from} <span>→</span> {route.to}</h3>
          <p>{route.departureTime} {route.timeZone} · {route.departurePoint}</p>
        </div>
        <div className="stepper" role="list" aria-label="Tahapan pemesanan">
          {STEPS.map((label, index) => {
            const stepNumber = (index + 1) as BookingStep
            return <div className={step >= stepNumber ? 'active' : ''} key={label} role="listitem" aria-current={step === stepNumber ? 'step' : undefined}>
              <i>{step > stepNumber ? <Icon name="check" size={13} /> : stepNumber}</i><span>{label}</span>
            </div>
          })}
        </div>
        <div className="drawer-body">
          {status === 'expired' ? (
            <div className="expired-state">
              <Icon name="alert" size={28} /><h4>Sesi Pemesanan Kedaluwarsa</h4>
              <p className="muted">Batas pembayaran sudah habis. Silakan pilih kursi kembali.</p>
              <button type="button" className="search-button" onClick={restart}><Icon name="refresh" size={16} /><span>Pilih Ulang Kursi</span></button>
            </div>
          ) : <>
            {step === 1 && <SeatPicker selectedSeats={seats} occupiedSeats={route.occupiedSeats} totalSeats={route.totalSeats}
              passengerCount={passengerCount} onSelectSeats={setSeats} />}
            {step === 2 && <PassengerForm data={passenger} onChange={(data) => { setPassenger(data); setFormErrors({}) }} errors={formErrors} />}
            {step === 3 && <DummyPayment trip={route} seats={seats} heldUntil={heldUntil} onExpire={() => setStatus('expired')} />}
            {step === 4 && booking && <TicketSuccess trip={route} seats={seats} passenger={passenger} bookingCode={booking.bookingCode} />}
          </>}
          {submitError && <div className="booking-error" role="alert">{submitError}</div>}
        </div>
        {status !== 'expired' && <div className="drawer-footer">
          <div><small>Total Harga</small><strong>{formatRupiah(route.price * passengerCount)}</strong></div>
          {step < 4 ? <button type="button" onClick={() => void handleNext()}
            disabled={isSubmitting || (step === 1 && seats.length !== passengerCount)}>
            <span>{isSubmitting ? 'Memproses…' : step === 3 ? 'Saya sudah bayar' : 'Lanjutkan'}</span><Icon name="arrow" size={18} />
          </button> : <button type="button" onClick={onClose}><span>Selesai</span><Icon name="check" size={18} /></button>}
        </div>}
      </div>
    </div>
  )
}
