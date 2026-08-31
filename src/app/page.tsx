import { Suspense } from 'react'
import { KelanaApp } from '@/components/KelanaApp'

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f6f1e8',
            color: '#172331',
            fontFamily: 'sans-serif',
          }}
        >
          Memuat Kelana Nova...
        </div>
      }
    >
      <KelanaApp />
    </Suspense>
  )
}
