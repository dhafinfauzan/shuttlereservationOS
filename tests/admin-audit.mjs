import { chromium } from 'playwright'
import { spawn } from 'child_process'

const api = spawn('node', ['dist/server.js'], {
  cwd: new URL('../apps/api', import.meta.url).pathname,
  stdio: 'inherit',
  env: { ...process.env, PORT: '4000', HOST: '127.0.0.1', DATABASE_URL: process.env.E2E_DATABASE_URL || 'file:./e2e.db' },
})
const admin = spawn('node', ['../../node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4574'], {
  cwd: new URL('../apps/admin', import.meta.url).pathname,
  stdio: 'inherit',
})

let browser
try {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const [apiResponse, adminResponse] = await Promise.all([
        fetch('http://127.0.0.1:4000/health'),
        fetch('http://127.0.0.1:4574/'),
      ])
      if (apiResponse.ok && adminResponse.ok) break
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()))
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
  await page.goto('http://127.0.0.1:4574/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Masuk' }).click()
  try {
    await page.locator('.metrics').waitFor({ timeout: 10_000 })
  } catch (error) {
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
    throw new Error(`Admin dashboard did not render. page=${pageErrors.join(' | ') || 'none'}, console=${consoleErrors.join(' | ') || 'none'}, body=${body}`, { cause: error })
  }
  await page.getByRole('button', { name: /Pemesanan/ }).click()
  await page.getByRole('heading', { name: 'Pemesanan', exact: true, level: 2 }).waitFor()
  const bookingRows = await page.locator('.booking-panel tbody tr').count()
  await page.setViewportSize({ width: 360, height: 800 })
  await page.getByRole('button', { name: 'Buka menu' }).click()
  await page.locator('.sidebar.open').waitFor()
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  if (documentWidth > 360) {
    throw new Error(`Admin mobile viewport overflows: ${documentWidth}px`)
  }
  if (bookingRows === 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(`Admin audit failed: rows=${bookingRows}, page=${pageErrors.join(' | ')}, console=${consoleErrors.join(' | ')}`)
  }
  console.log(`Admin API login and booking table passed (${bookingRows} rows).`)
} finally {
  if (browser) await browser.close()
  admin.kill('SIGTERM')
  api.kill('SIGTERM')
}
