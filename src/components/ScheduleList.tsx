import React from 'react'
import { Trip, SearchQuery } from '@/types/trip'
import { formatRupiah, formatDateIndonesian } from '@/lib/utils'
import { Icon } from './Icon'

interface ScheduleListProps {
  query: SearchQuery
  trips: Trip[]
  onChoose: (trip: Trip) => void
  isLoading?: boolean
  error?: string | null
}

export function ScheduleList({ query, trips, onChoose, isLoading, error }: ScheduleListProps) {
  const formattedDate = formatDateIndonesian(query.date)

  return (
    <section className="schedule section" id="jadwal" aria-labelledby="schedule-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow red">Jadwal pilihan</span>
          <h2 id="schedule-heading">
            {query.from} <span>→</span> {query.to}
          </h2>
        </div>
        <p>
          {formattedDate} · {query.passengers} penumpang
        </p>
      </div>

      {isLoading ? (
        <div className="schedule-state" role="status">Memuat jadwal terbaru…</div>
      ) : error ? (
        <div className="schedule-state error" role="alert">{error}. Pastikan Kelana API sedang berjalan.</div>
      ) : trips.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--paper)',
            border: '1px solid var(--line)',
          }}
        >
          <p style={{ margin: 0, color: 'var(--ink)' }}>
            Belum ada jadwal tersedia untuk rute {query.from} menuju {query.to} pada tanggal ini.
          </p>
        </div>
      ) : (
        <div className="route-list" role="feed" aria-label="Daftar jadwal yang tersedia">
          {trips.map((route, index) => {
            const isFeatured = route.label === 'Favorit' || index === 1
            return (
              <article
                className={`route-row ${isFeatured ? 'featured' : ''}`}
                key={route.id}
                aria-labelledby={`trip-time-${route.id}`}
              >
                <div className="route-time">
                  <strong id={`trip-time-${route.id}`}>{route.departureTime}</strong>
                  <span>{route.label || 'Reguler'}</span>
                </div>

                <div className="route-line" aria-label={`Durasi perjalanan ${route.duration}`}>
                  <i aria-hidden="true" />
                  <span>{route.duration}</span>
                  <i aria-hidden="true" />
                </div>

                <div className="route-time arrival">
                  <strong>
                    {route.arrivalTime} <small style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red)' }}>{route.timeZone}</small>
                  </strong>
                  <span>Estimasi tiba</span>
                </div>

                <div className="route-points">
                  <b>{route.departurePoint}</b>
                  <span>{route.arrivalPoint}</span>
                </div>

                <div className="route-price">
                  <small>Mulai dari</small>
                  <strong>{formatRupiah(route.price)}</strong>
                  <span>{route.availableSeats} kursi tersisa</span>
                </div>

                <button
                  type="button"
                  onClick={() => onChoose(route)}
                  disabled={!route.isAvailable}
                  aria-label={`Pilih keberangkatan jam ${route.departureTime} rute ${route.from} ke ${route.to}, harga ${formatRupiah(route.price)}`}
                >
                  <span>{route.isAvailable ? 'Pilih' : 'Tidak cukup kursi'}</span>
                  <Icon name="arrow" size={17} />
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
