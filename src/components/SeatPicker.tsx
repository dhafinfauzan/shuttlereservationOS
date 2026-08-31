import React from 'react'

interface SeatPickerProps {
  selectedSeats: number[]
  occupiedSeats: number[]
  totalSeats?: number
  passengerCount: number
  onSelectSeats: (seats: number[]) => void
}

export function SeatPicker({
  selectedSeats,
  occupiedSeats,
  totalSeats = 12,
  passengerCount,
  onSelectSeats,
}: SeatPickerProps) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1)

  return (
    <div className="seat-picker-container">
      <h4>Pilih kursi favoritmu</h4>
      <p className="muted">Pilih {passengerCount} kursi · Executive shuttle (Kapasitas {totalSeats} kursi)</p>

      <div className="seat-map" role="group" aria-label="Peta pemilihan kursi">
        <div className="driver" aria-hidden="true">
          <span>Kemudi</span>
        </div>

        <div className="seats" role="radiogroup" aria-label="Pilihan kursi">
          {seats.map((seatNum) => {
            const isOccupied = occupiedSeats.includes(seatNum)
            const isSelected = selectedSeats.includes(seatNum)

            let label = `Kursi ${seatNum}`
            if (isOccupied) {
              label += ' (Terisi, tidak dapat dipilih)'
            } else if (isSelected) {
              label += ' (Pilihan Anda saat ini)'
            } else {
              label += ' (Tersedia)'
            }

            return (
              <button
                key={seatNum}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isOccupied}
                className={isSelected ? 'selected' : ''}
                onClick={() => {
                  if (isSelected) {
                    onSelectSeats(selectedSeats.filter((seat) => seat !== seatNum))
                  } else if (selectedSeats.length < passengerCount) {
                    onSelectSeats([...selectedSeats, seatNum].sort((a, b) => a - b))
                  }
                }}
                aria-label={label}
              >
                {seatNum}
              </button>
            )
          })}
        </div>

        <div className="seat-legend" aria-hidden="true">
          <span>
            <i /> Tersedia
          </span>
          <span>
            <i className="picked" /> Pilihanmu
          </span>
          <span>
            <i className="sold" /> Terisi
          </span>
        </div>
      </div>
    </div>
  )
}
