import React from 'react'
import { Icon } from './Icon'

export function FleetSection() {
  return (
    <section className="fleet section" id="armada" aria-labelledby="fleet-heading">
      <div
        className="fleet-photo"
        role="img"
        aria-label="Ilustrasi visual armada eksekutif merah Kelana Nova"
      >
        <div className="photo-note">PLACEHOLDER FOTO ARMADA KELANA</div>
        <div className="bus-illustration" aria-hidden="true">
          <div className="bus-windows">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="bus-stripe">KELANA</div>
          <span className="wheel left" />
          <span className="wheel right" />
        </div>
      </div>

      <div className="fleet-copy">
        <span className="eyebrow red">Dibuat untuk perjalanan</span>
        <h2 id="fleet-heading">
          Tenang di jalan.<br />
          <em>Segar saat tiba.</em>
        </h2>
        <p>
          Kabin lega, kursi ergonomis, dan pengemudi profesional. Semua detail dipikirkan
          agar perjalanan antarkota terasa lebih ringan dan menyenangkan.
        </p>

        <div className="feature-list" role="list">
          <div className="feature-item" role="listitem">
            <Icon name="seat" size={20} />
            <span>Captain seat ergonomis & reclining</span>
          </div>
          <div className="feature-item" role="listitem">
            <Icon name="shield" size={20} />
            <span>Perjalanan aman dengan GPS tracking & driver tersertifikasi</span>
          </div>
          <div className="feature-item" role="listitem">
            <Icon name="clock" size={20} />
            <span>Jadwal tepat waktu tanpa transit berbelit</span>
          </div>
        </div>
      </div>
    </section>
  )
}
