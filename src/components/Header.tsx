import React from 'react'
import Link from 'next/link'
import { Icon } from './Icon'

export function Header() {
  return (
    <header className="header" role="banner">
      <Link href="/" className="brand" aria-label="Kelana Nova - Beranda">
        <span className="brand-mark" aria-hidden="true">
          <span>A</span>
        </span>
        <span>
          <b>KELANA</b>
          <small>SHUTTLE</small>
        </span>
      </Link>
      <nav className="nav" aria-label="Navigasi utama">
        <a href="#jadwal">Jadwal</a>
        <a href="#armada">Armada</a>
        <a href="#tentang">Tentang</a>
      </nav>
      <a className="header-cta" href="#pesan" aria-label="Pesan tiket perjalanan sekarang">
        <span>Pesan tiket</span>
        <Icon name="arrow" size={17} />
      </a>
    </header>
  )
}
