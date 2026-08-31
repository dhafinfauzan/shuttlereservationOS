'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from './Header'
import { SearchForm } from './SearchForm'
import { ScheduleList } from './ScheduleList'
import { FleetSection } from './FleetSection'
import { AboutSection } from './AboutSection'
import { Footer } from './Footer'
import { BookingDrawer } from './BookingDrawer'
import { Trip, SearchQuery } from '@/types/trip'
import { getJakartaDate } from '@/lib/utils'
import { loadSeatMap, searchSchedules } from '@/lib/api'

export function KelanaApp() {
  const searchParams = useSearchParams()

  const initialFrom = searchParams.get('from') || 'Jakarta'
  const initialTo = searchParams.get('to') || 'Bandung'
  const initialDate = searchParams.get('date') || getJakartaDate()
  const parsedPassengers = Number(searchParams.get('passengers')) || 1
  const initialPassengers = Math.min(5, Math.max(1, parsedPassengers))

  const [query, setQuery] = useState<SearchQuery>({
    from: initialFrom,
    to: initialTo,
    date: initialDate,
    passengers: initialPassengers,
  })

  const [selectedRoute, setSelectedRoute] = useState<Trip | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    searchSchedules(query)
      .then((result) => {
        if (!active) return
        setTrips(result)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setTrips([])
        setLoadError(error instanceof Error ? error.message : 'Jadwal gagal dimuat')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [query])

  const handleSearch = (newQuery: SearchQuery) => {
    setIsLoading(true)
    setLoadError(null)
    setQuery(newQuery)
  }

  const handleChoose = async (trip: Trip) => {
    try {
      setLoadError(null)
      setSelectedRoute(await loadSeatMap(trip))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Peta kursi gagal dimuat')
    }
  }

  return (
    <>
      <main id="top">
        <Header />

        {/* Hero Section */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-kicker">
            <span>01</span>
            <i aria-hidden="true" />
            <span>JAKARTA · BANDUNG</span>
          </div>

          <div className="hero-content">
            <h1 id="hero-title">
              Jalan nyaman.<br />
              <em>Sampai tenang.</em>
            </h1>
            <p>
              Shuttle antarkota yang mengutamakan kenyamanan, ketepatan waktu, dan perjalanan
              tanpa ribet untuk setiap destinasi pilihan Anda.
            </p>
          </div>

          <div className="hero-stamp" aria-hidden="true">
            <span>KELANA</span>
            <small>
              YOUR WAY<br />
              FORWARD
            </small>
          </div>

          <SearchForm initialQuery={query} onSearch={handleSearch} />
        </section>

        {/* Schedule List */}
        <ScheduleList
          query={query}
          trips={trips}
          onChoose={handleChoose}
          isLoading={isLoading}
          error={loadError}
        />

        {/* Fleet Section */}
        <FleetSection />

        {/* About Section */}
        <AboutSection />
      </main>

      <Footer />

      {/* Booking Drawer Modal */}
      <BookingDrawer
        key={selectedRoute?.id || 'closed'}
        route={selectedRoute}
        passengerCount={query.passengers}
        onClose={() => setSelectedRoute(null)}
      />
    </>
  )
}
