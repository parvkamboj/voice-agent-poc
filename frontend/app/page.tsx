'use client'

import { useCallback, useState } from 'react'
import { Radio } from 'lucide-react'
import { AgentConfig } from '@/components/AgentConfig'
import { VoiceSession } from '@/components/VoiceSession'
import { TranscriptView } from '@/components/TranscriptView'
import { EnvBanner } from '@/components/EnvBanner'
import { AgentConfig as AgentConfigType, DEFAULT_CONFIG, TranscriptMessage } from '@/lib/types'

export default function HomePage() {
  const [config, setConfig] = useState<AgentConfigType>(DEFAULT_CONFIG)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [sessionActive, setSessionActive] = useState(false)

  const handleTranscript = useCallback((msg: TranscriptMessage) => {
    setTranscript((prev) => [...prev, msg])
  }, [])

  const handleClearTranscript = useCallback(() => setTranscript([]), [])

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <EnvBanner />

      <header className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30">
          <Radio className="h-4 w-4 text-violet-400" />
        </div>
        <h1 className="text-sm font-semibold">Voice Agent Lab</h1>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-72 shrink-0 border-r border-zinc-800 flex flex-col min-h-0">
          <AgentConfig
            config={config}
            onConfigChange={setConfig}
            disabled={sessionActive}
          />
        </aside>

        <main className="flex-1 flex flex-col min-h-0">
          <section className="flex-1 flex items-center justify-center min-h-0">
            <VoiceSession
              config={config}
              onTranscript={handleTranscript}
              onActiveChange={setSessionActive}
            />
          </section>

          <section className="h-56 shrink-0 border-t border-zinc-800">
            <TranscriptView messages={transcript} onClear={handleClearTranscript} />
          </section>
        </main>
      </div>
    </div>
  )
}
