import React from 'react'
import Link from 'next/link'
import { Icon } from './Icon'

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <Link href="/" className="brand inverse" aria-label="Kelana Nova Beranda">
        <span className="brand-mark" aria-hidden="true">
          <span>A</span>
        </span>
        <span>
          <b>KELANA</b>
          <small>SHUTTLE</small>
        </span>
      </Link>

      <p>
        Prototype pengalaman booking shuttle antarkota — Dibuat untuk kenyamanan & kemudahan perjalanan.
      </p>

      <a
        href="https://www.instagram.com/kelananova.transit/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Kunjungi akun Instagram resmi Kelana Nova di @kelananova.transit (buka di tab baru)"
      >
        <Icon name="instagram" size={18} />
        <span>@kelananova.transit</span>
      </a>
    </footer>
  )
}
