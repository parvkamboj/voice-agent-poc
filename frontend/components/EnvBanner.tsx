'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface EnvStatus {
  url: boolean
  apiKey: boolean
  apiSecret: boolean
}

export function EnvBanner() {
  const [status, setStatus] = useState<EnvStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/token')
      .then((r) => r.json())
      .then((d: EnvStatus) => setStatus(d))
      .catch(() => {})
  }, [])

  if (!status || dismissed) return null

  const missing: string[] = []
  if (!status.url) missing.push('LIVEKIT_URL')
  if (!status.apiKey) missing.push('LIVEKIT_API_KEY')
  if (!status.apiSecret) missing.push('LIVEKIT_API_SECRET')

  if (missing.length === 0) return null

  return (
    <div className="flex items-start gap-3 bg-yellow-950/40 border-b border-yellow-800/40 px-4 py-2.5">
      <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-yellow-400 font-medium">
          Missing environment variables:{' '}
          <span className="font-mono">{missing.join(', ')}</span>
        </p>
        <p className="text-xs text-yellow-600 mt-0.5">
          Copy <code className="font-mono">.env.local.example</code> to{' '}
          <code className="font-mono">.env.local</code> and fill in your LiveKit credentials.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-600 hover:text-yellow-400 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
