'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from './Icon'
import { AVAILABLE_CITIES } from '@/data/trips'
import { searchQuerySchema } from '@/lib/schemas'
import { SearchQuery } from '@/types/trip'
import { getJakartaDate } from '@/lib/utils'

interface SearchFormProps {
  initialQuery: SearchQuery
  onSearch?: (query: SearchQuery) => void
}

export function SearchForm({ initialQuery, onSearch }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [from, setFrom] = useState(initialQuery.from || 'Jakarta')
  const [to, setTo] = useState(initialQuery.to || 'Bandung')
  const [date, setDate] = useState(initialQuery.date || getJakartaDate())
  const [passengers, setPassengers] = useState(initialQuery.passengers || 1)
  const [error, setError] = useState<string | null>(null)

  const handleSwap = () => {
    const tempFrom = from
    const tempTo = to
    setFrom(tempTo)
    setTo(tempFrom)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (from === to) {
      setError('Kota asal dan kota tujuan tidak boleh sama')
      return
    }

    const parseResult = searchQuerySchema.safeParse({
      from,
      to,
      date,
      passengers,
    })

    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message)
      return
    }

    setError(null)
    const newQuery: SearchQuery = parseResult.data

    // Update URL query parameters
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', newQuery.from)
    params.set('to', newQuery.to)
    params.set('date', newQuery.date)
    params.set('passengers', newQuery.passengers.toString())

    router.replace(`?${params.toString()}`, { scroll: false })

    if (onSearch) {
      onSearch(newQuery)
    }

    // Smooth scroll to schedule section
    const el = document.getElementById('jadwal')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="search-card" id="pesan">
      <div className="search-head">
        <span className="eyebrow">Pesan perjalanan</span>
        <span className="live-dot" aria-label="Status operasional: Berangkat setiap hari">
          Berangkat setiap hari
        </span>
      </div>

      {error && (
        <div className="search-error" role="alert" style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="search-grid" aria-label="Form pencarian tiket perjalanan">
        <label htmlFor="search-from">
          <span>Dari</span>
          <div className="input-shell">
            <Icon name="map" size={18} />
            <select
              id="search-from"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setError(null)
              }}
              aria-label="Pilih kota keberangkatan"
            >
              {AVAILABLE_CITIES.map((city) => (
                <option key={`from-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </label>

        <button
          type="button"
          className="swap"
          onClick={handleSwap}
          aria-label="Tukar kota keberangkatan dan tujuan"
          title="Tukar rute"
        >
          <Icon name="swap" size={18} />
        </button>

        <label htmlFor="search-to">
          <span>Ke</span>
          <div className="input-shell">
            <Icon name="map" size={18} />
            <select
              id="search-to"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setError(null)
              }}
              aria-label="Pilih kota tujuan"
            >
              {AVAILABLE_CITIES.map((city) => (
                <option key={`to-${city}`} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label htmlFor="search-date">
          <span>Tanggal</span>
          <div className="input-shell">
            <Icon name="calendar" size={18} />
            <input
              id="search-date"
              type="date"
              min={getJakartaDate()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setError(null)
              }}
              aria-label="Tanggal keberangkatan"
            />
          </div>
        </label>

        <label htmlFor="search-passengers">
          <span>Penumpang</span>
          <div className="input-shell">
            <Icon name="users" size={18} />
            <select
              id="search-passengers"
              value={passengers}
              onChange={(e) => {
                setPassengers(Number(e.target.value))
                setError(null)
              }}
              aria-label="Jumlah penumpang"
            >
              <option value="1">1 orang</option>
              <option value="2">2 orang</option>
              <option value="3">3 orang</option>
              <option value="4">4 orang</option>
              <option value="5">5 orang</option>
            </select>
          </div>
        </label>

        <button type="submit" className="search-button" aria-label="Cari jadwal perjalanan">
          <span>Cari jadwal</span>
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </div>
  )
}
