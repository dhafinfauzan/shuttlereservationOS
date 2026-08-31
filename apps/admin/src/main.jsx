import React, { useCallback, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api } from './api'
import './styles.css'

const rupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value || 0)

const nav = [
  ['overview', 'grid', 'Ringkasan'], ['bookings', 'ticket', 'Pemesanan'],
  ['schedule', 'calendar', 'Jadwal'], ['routes', 'route', 'Rute & titik'], ['fleet', 'bus', 'Armada'],
]

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    ticket: <><path d="M2 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    route: <><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M6 16v-3a4 4 0 0 1 4-4h4a4 4 0 0 0 4-4"/></>,
    bus: <><path d="M5 17H3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v11h-2M5 11h14M7 7h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/></>,
    seat: <><path d="M7 12V5a2 2 0 0 1 4 0v7M5 12h12a2 2 0 0 1 2 2v4H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>, menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('rani@kelana.test')
  const [password, setPassword] = useState('Admin123!')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try { await onLogin(email, password) } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }
  return <main className="login-shell"><form className="login-card" onSubmit={submit}>
    <div className="brand login-brand"><span className="brand-mark">A</span><span><b>KELANA</b><small>OPERATIONS</small></span></div>
    <span className="eyebrow">AKSES TERBATAS</span><h1>Masuk ke operasional</h1><p>Gunakan akun owner atau admin CS.</p>
    <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required/></label>
    <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required/></label>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <button type="submit" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
  </form></main>
}

function Brand() { return <div className="brand"><span className="brand-mark">A</span><span><b>KELANA</b><small>OPERATIONS</small></span></div> }

function Sidebar({ active, setActive, open, onClose, onLogout, bookingCount }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigasi admin">
    <div className="side-top"><Brand/><button className="mobile-close" onClick={onClose} aria-label="Tutup menu"><Icon name="close"/></button></div>
    <div className="nav-label">Workspace</div><nav>{nav.map(([id, icon, label]) => <button key={id} className={active === id ? 'active' : ''}
      onClick={() => { setActive(id); onClose() }}><Icon name={icon}/><span>{label}</span>{id === 'bookings' && <em>{bookingCount}</em>}</button>)}</nav>
    <div className="side-bottom"><button className="logout" onClick={onLogout}><Icon name="logout"/><span>Keluar</span></button></div>
  </aside>
}

function Header({ title, user, onMenu }) {
  return <header className="topbar"><button className="menu-button" onClick={onMenu} aria-label="Buka menu"><Icon name="menu"/></button>
    <div><span className="crumb">Kelana Ops / {title}</span><h1>{title}</h1></div><div className="top-actions">
      <button className="notification" aria-label="Notifikasi"><Icon name="bell"/></button>
      <div className="profile"><span>{user.avatar || user.name.slice(0, 2).toUpperCase()}</span><div><b>{user.name}</b><small>{user.role}</small></div></div>
    </div></header>
}

function Metric({ metric }) { return <article className="metric"><div className={`metric-icon ${metric.tone}`}><Icon name={metric.icon}/></div>
  <div className="metric-head"><span>{metric.label}</span></div><strong>{metric.value}</strong><div className="metric-note">{metric.note}</div></article> }

function RevenueChart({ revenue }) {
  return <section className="panel revenue-panel"><div className="panel-heading"><div><span className="eyebrow">PERFORMA {revenue.periodDays} HARI</span><h2>Pendapatan</h2></div></div>
    <div className="revenue-total"><strong>{revenue.formattedTotal}</strong></div><div className="chart"><div className="plot">
      {revenue.bars.map((bar) => <div className={`bar-wrap ${bar.isFocus ? 'focus' : ''}`} key={bar.date}><i style={{height: `${Math.max(bar.height, 2)}%`}}/><span>{bar.dayLabel}</span>{bar.isFocus && <b>{bar.amountLabel}</b>}</div>)}
    </div></div></section>
}

function Occupancy({ occupancy }) { return <section className="panel occupancy"><div className="panel-heading"><div><span className="eyebrow">HARI INI</span><h2>Keterisian kursi</h2></div></div>
  <div className="donut" style={{'--percent': occupancy.occupancyPercentage}}><div><strong>{occupancy.occupancyPercentage}</strong><span>{occupancy.summaryText}</span></div></div>
  <div className="occupancy-legend"><div><i className="sold"/><span>Terjual</span><b>{occupancy.soldSeats}</b></div><div><i/><span>Tersedia</span><b>{occupancy.availableSeats}</b></div></div></section> }

function ScheduleTable({ trips }) { return <section className="panel schedule-panel full-table"><div className="panel-heading"><div><span className="eyebrow">OPERASIONAL</span><h2>Jadwal perjalanan</h2></div></div>
  <div className="table-scroll"><table><thead><tr><th>TANGGAL / WAKTU</th><th>RUTE & TITIK</th><th>PENGEMUDI / ARMADA</th><th>KURSI</th><th>STATUS</th></tr></thead>
    <tbody>{trips.map((trip) => <tr key={trip.id}><td><strong className="time">{trip.time}</strong><small>{trip.date} · {trip.tripCode}</small></td><td><b>{trip.route}</b><small>{trip.point}</small></td>
      <td><b>{trip.driver}</b><small>{trip.vehicle}</small></td><td><div className="seat-count"><b>{trip.sold}</b><span>/{trip.capacity}</span></div></td><td><span className={`status ${String(trip.rawStatus).toLowerCase()}`}>{trip.status}</span></td></tr>)}</tbody></table>
    {trips.length === 0 && <p className="empty-copy">Belum ada jadwal.</p>}</div></section> }

function BookingTable({ bookings }) {
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')
  const rows = bookings.filter((item) => (filter === 'Semua' || item.status === filter) && `${item.bookingCode} ${item.customerName}`.toLowerCase().includes(search.toLowerCase()))
  return <section className="panel booking-panel"><div className="panel-heading booking-heading"><div><span className="eyebrow">TRANSAKSI</span><h2>Pemesanan</h2></div>
    <input className="table-search" aria-label="Cari booking" placeholder="Cari kode atau nama" value={search} onChange={(e) => setSearch(e.target.value)}/>
    <div className="filter-tabs">{['Semua','Lunas','Menunggu','Batal'].map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    <div className="table-scroll"><table><thead><tr><th>PENUMPANG</th><th>KODE</th><th>PERJALANAN</th><th>KURSI</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.id}><td><b>{row.customerName}</b><small>{row.phone}</small></td><td><code>{row.bookingCode}</code></td><td><b>{row.route}</b><small>{row.date} · {row.time} WIB</small></td><td>{Array.isArray(row.seats) ? row.seats.join(', ') : row.seats}</td><td><b>{rupiah(row.amount || row.totalAmount)}</b></td><td><span className={`payment-status ${row.status.toLowerCase()}`}>{row.status}</span></td></tr>)}</tbody></table>
      {rows.length === 0 && <p className="empty-copy">Tidak ada booking yang cocok.</p>}</div></section>
}

function Activity({ items }) { return <section className="panel activity"><div className="panel-heading"><div><span className="eyebrow">LIVE UPDATE</span><h2>Aktivitas</h2></div></div>
  <div className="activity-list">{items.map((item) => <div className="activity-row" key={item.id}><i className={item.type}><Icon name="ticket" size={16}/></i><div><b>{item.title}</b><span>{item.detail}</span></div><time>{item.timeAgo}</time></div>)}</div>
  {items.length === 0 && <p className="empty-copy">Belum ada aktivitas.</p>}</section> }

function AddTripModal({ masters, onClose, onSubmit }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); const data = new FormData(event.currentTarget)
    try { await onSubmit(Object.fromEntries(data)); onClose() } catch (reason) { setError(reason.message) } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal" role="dialog" aria-modal="true" aria-labelledby="add-trip-title" onSubmit={submit}>
      <div className="modal-head"><div><span className="eyebrow">JADWAL BARU</span><h2 id="add-trip-title">Tambah keberangkatan</h2></div><button type="button" onClick={onClose} aria-label="Tutup modal"><Icon name="close"/></button></div>
      <div className="modal-body"><label>Tanggal<input type="date" name="departureDate" required/></label><label>Berangkat<input type="time" name="departureTime" required/></label><label>Tiba<input type="time" name="arrivalTime" required/></label>
        <label className="wide">Rute<select name="routeId" required>{masters.routes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Titik berangkat<select name="departurePointId" required>{masters.points.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Titik tiba<select name="arrivalPointId" required>{masters.points.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Pengemudi<select name="driverId" required>{masters.drivers.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
        <label>Armada<select name="vehicleId" required>{masters.vehicles.map((item) => <option value={item.id} key={item.id}>{item.plateNumber}</option>)}</select></label>
        <label>Harga<input type="number" name="basePrice" min="1" defaultValue="145000" required/></label></div>
      {error && <div className="admin-error" role="alert">{error}</div>}<div className="modal-footer"><button type="button" onClick={onClose}>Batal</button><button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan jadwal'}</button></div>
    </form></div>
}

function App() {
  const [session, setSession] = useState(null); const [active, setActive] = useState('overview'); const [sidebar, setSidebar] = useState(false); const [modal, setModal] = useState(false)
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const titles = { overview: 'Ringkasan', bookings: 'Pemesanan', schedule: 'Jadwal', routes: 'Rute & titik', fleet: 'Armada' }

  const load = useCallback(async (token) => {
    setLoading(true); setError('')
    try {
      const [[summary, revenue, occupancy, activity], trips, bookings, routes, points, vehicles, drivers] = await Promise.all([
        api.dashboard(token), api.trips(token), api.bookings(token), api.routes(token), api.points(token), api.vehicles(token), api.drivers(token),
      ])
      setData({ summary, revenue, occupancy, activity, trips, bookings, masters: { routes, points, vehicles, drivers } })
    } catch (reason) { setError(reason.message) } finally { setLoading(false) }
  }, [])

  const login = async (email, password) => { const next = await api.login(email, password); setSession(next); await load(next.token) }
  const createTrip = async (form) => {
    await api.createTrip(session.token, { ...form, basePrice: Number(form.basePrice), capacity: 12, timezone: 'WIB' }); await load(session.token)
  }
  const content = useMemo(() => {
    if (!data) return null
    if (active === 'bookings') return <BookingTable bookings={data.bookings}/>
    if (active === 'schedule') return <ScheduleTable trips={data.trips}/>
    if (active === 'routes') return <section className="management"><div className="management-hero"><span className="eyebrow">MASTER DATA</span><h2>Rute & titik</h2><p>{data.masters.routes.length} rute dan {data.masters.points.length} titik aktif dari API.</p></div></section>
    if (active === 'fleet') return <section className="management"><div className="management-hero"><span className="eyebrow">MASTER DATA</span><h2>Armada</h2><p>{data.masters.vehicles.length} armada dan {data.masters.drivers.length} pengemudi terdaftar.</p></div></section>
    return <><div className="welcome"><div><span>{data.summary.date}</span><h2>Selamat datang, {session.user.name}.</h2><p>Ada <b>{data.summary.tripsCount} keberangkatan</b> pada tanggal operasional.</p></div><div className="city-time"><span>WAKTU OPERASIONAL · JAKARTA</span><strong>{data.summary.operationalTime}</strong></div></div>
      <div className="metrics">{Object.values(data.summary.metrics).map((metric) => <Metric metric={metric} key={metric.label}/>)}</div>
      <div className="dashboard-grid"><RevenueChart revenue={data.revenue}/><Occupancy occupancy={data.occupancy}/><ScheduleTable trips={data.trips}/><Activity items={data.activity}/></div></>
  }, [active, data, session])

  if (!session) return <Login onLogin={login}/>
  return <div className="app-shell"><Sidebar active={active} setActive={setActive} open={sidebar} onClose={() => setSidebar(false)} bookingCount={data?.bookings.length || 0} onLogout={() => { setSession(null); setData(null) }}/>
    {sidebar && <div className="side-overlay" onClick={() => setSidebar(false)}/>}<div className="workspace"><Header title={titles[active]} user={session.user} onMenu={() => setSidebar(true)}/>
      <main className="content"><div className="content-actions"><button onClick={() => setModal(true)} disabled={!data}><Icon name="plus"/> Tambah keberangkatan</button></div>
        {error && <div className="admin-error" role="alert">{error}</div>}{loading ? <p className="loading-copy" role="status">Memuat data operasional…</p> : content}</main></div>
    {modal && data && <AddTripModal masters={data.masters} onClose={() => setModal(false)} onSubmit={createTrip}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>)
