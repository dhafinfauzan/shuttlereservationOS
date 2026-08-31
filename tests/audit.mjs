import { chromium } from 'playwright'
import { spawn } from 'child_process'

async function runAudit() {
  const PORT = 4569
  console.log(`Starting Next.js server on port ${PORT}...`)
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  })
  const apiServer = spawn('node', ['dist/server.js'], {
    cwd: new URL('../apps/api', import.meta.url).pathname,
    stdio: 'inherit',
    env: { ...process.env, PORT: '4000', HOST: '127.0.0.1', DATABASE_URL: process.env.E2E_DATABASE_URL || 'file:./e2e.db' },
  })

  let browser = null

  try {
    // Wait for customer frontend and API to be up
    let ready = false
    for (let i = 0; i < 30; i++) {
      try {
        const [res, apiRes] = await Promise.all([
          fetch(`http://127.0.0.1:${PORT}/`),
          fetch('http://127.0.0.1:4000/health'),
        ])
        if (res.ok && apiRes.ok) {
          ready = true
          break
        }
      } catch {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    if (!ready) {
      throw new Error('Server failed to start in time')
    }

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    console.log('Testing Desktop 1440px...')
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'audit-desktop.png', fullPage: true })

    const desktopMetrics = await page.evaluate(() => ({
      title: document.title,
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      buttons: document.querySelectorAll('button').length,
      headings: document.querySelectorAll('h1,h2,h3,h4').length,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }))

    console.log('Desktop Metrics:', desktopMetrics)

    // Step 1: Open drawer by clicking 'Pilih'
    console.log('Opening Booking Drawer...')
    await page.locator('.route-row button:not([disabled])').first().click()
    await page.waitForTimeout(400)

    // Step 1 -> 2: Click Lanjutkan (Seat -> Passenger)
    console.log('Step 1 -> 2: Seat selected, proceeding to Passenger data...')
    await page.locator('.drawer-footer button').click()
    await page.waitForTimeout(400)

    // Step 2 -> 3: Enter passenger data and create a real API booking
    console.log('Step 2 -> 3: Passenger data entered, proceeding to Payment...')
    await page.locator('#passenger-name').fill('Audit Customer')
    await page.locator('#passenger-whatsapp').fill('081234567890')
    await page.locator('#passenger-email').fill('audit.customer@example.com')
    await page.locator('.drawer-footer button').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'audit-payment.png', fullPage: true })

    // Step 3 -> 4: Click Saya sudah bayar (Payment -> Ticket)
    console.log('Step 3 -> 4: Simulating QRIS payment...')
    await page.locator('.drawer-footer button').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'audit-ticket.png', fullPage: true })

    const ticketVisible = await page.getByText('Pemesanan berhasil').isVisible()
    const bookingCodeVisible = await page.locator('.ticket strong').isVisible()
    console.log('Ticket Visible:', ticketVisible, '| Booking Code Visible:', bookingCodeVisible)

    // Close drawer
    console.log('Closing drawer via Selesai button...')
    await page.locator('.drawer-footer button').click()
    await page.waitForTimeout(300)

    // Mobile 360px test (Strict Acceptance Criteria)
    console.log('Testing Mobile 360px viewport...')
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
    const mobile360Metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }))
    console.log('Mobile 360px Metrics:', mobile360Metrics)
    await page.screenshot({ path: 'audit-mobile.png', fullPage: true })

    // Open drawer on mobile
    console.log('Opening Drawer on Mobile 360px...')
    await page.locator('.route-row button:not([disabled])').first().click()
    await page.waitForTimeout(400)
    const mobileDrawerMetrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      drawerWidth: document.querySelector('.drawer')?.getBoundingClientRect().width,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }))
    console.log('Mobile Drawer Metrics:', mobileDrawerMetrics)
    await page.screenshot({ path: 'audit-mobile-booking.png' })

    // Test ESC key closing drawer
    console.log('Testing keyboard ESC key...')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const isDrawerClosed = !(await page.locator('.drawer').isVisible())
    console.log('ESC key closes drawer:', isDrawerClosed)

    console.log('\n--- AUDIT SUMMARY ---')
    console.log('Desktop Horizontal Scroll Free:', !desktopMetrics.hasHorizontalScroll)
    console.log('Mobile 360px Horizontal Scroll Free:', !mobile360Metrics.hasHorizontalScroll)
    console.log('Booking Flow Complete & Ticket Generated:', ticketVisible && bookingCodeVisible)
    console.log('Keyboard ESC Accessibility:', isDrawerClosed)
    console.log('Console Errors:', consoleErrors.length === 0 ? 'None' : consoleErrors)

    if (
      !desktopMetrics.hasHorizontalScroll &&
      !mobile360Metrics.hasHorizontalScroll &&
      ticketVisible &&
      bookingCodeVisible &&
      isDrawerClosed &&
      consoleErrors.length === 0
    ) {
      console.log('\n✨ ALL AUDIT TESTS PASSED SUCCESSFULLY! ✨')
    } else {
      throw new Error('Audit assertions failed')
    }
  } finally {
    if (browser) await browser.close()
    server.kill()
    apiServer.kill()
    // Ensure child processes are killed
    try {
      process.kill(-server.pid)
    } catch {}
    try {
      process.kill(-apiServer.pid)
    } catch {}
  }
}

runAudit().catch(err => {
  console.error(err)
  process.exit(1)
})
