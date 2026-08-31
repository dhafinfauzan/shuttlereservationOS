import React from 'react'
import { PassengerData } from '@/types/trip'

interface PassengerFormProps {
  data: PassengerData
  onChange: (data: PassengerData) => void
  errors: Partial<Record<keyof PassengerData, string>>
}

export function PassengerForm({ data, onChange, errors }: PassengerFormProps) {
  const handleChange = (field: keyof PassengerData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    })
  }

  return (
    <div className="passenger-form-container">
      <h4>Data penumpang</h4>
      <p className="muted">E-ticket dan update perjalanan akan dikirim ke kontak di bawah.</p>

      <div className="form-stack">
        <label htmlFor="passenger-name">
          <span>Nama lengkap (sesuai KTP/identitas)</span>
          <input
            id="passenger-name"
            type="text"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Contoh: Dimas Pratama"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'error-passenger-name' : undefined}
            required
          />
          {errors.fullName && (
            <span id="error-passenger-name" className="field-error" role="alert">
              {errors.fullName}
            </span>
          )}
        </label>

        <label htmlFor="passenger-whatsapp">
          <span>Nomor WhatsApp</span>
          <input
            id="passenger-whatsapp"
            type="tel"
            value={data.whatsapp}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            placeholder="Contoh: 081234567890"
            autoComplete="tel"
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? 'error-passenger-whatsapp' : undefined}
            required
          />
          {errors.whatsapp && (
            <span id="error-passenger-whatsapp" className="field-error" role="alert">
              {errors.whatsapp}
            </span>
          )}
        </label>

        <label htmlFor="passenger-email">
          <span>Email</span>
          <input
            id="passenger-email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Contoh: dimas@email.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'error-passenger-email' : undefined}
            required
          />
          {errors.email && (
            <span id="error-passenger-email" className="field-error" role="alert">
              {errors.email}
            </span>
          )}
        </label>
      </div>
    </div>
  )
}
